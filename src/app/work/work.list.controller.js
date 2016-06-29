'use strict';

var module = angular.module('supportAdminApp');

module.controller('WorkListCtrl', ['$scope', 'WorkService', '$timeout',
  function($scope, $workService, $timeout) {
    angular.element(document).ready(function() {
      $('.footable').footable({
        addRowToggle: true
      });
    });
    $scope.workSteps = [];
    $scope.progress = [];
    /* 
     * returns the work object related to the workId
     */
    var getWork = function(workId) {
      $scope.isLoading = true;
      $workService.getWorkSteps(workId).then(
        function(responseWork) {
          $timeout(function() {
            $('.footable').trigger('footable_redraw');
          }, 100);
          $scope.workSteps = responseWork;
          $scope.isLoading = false;
        },
        function(error) {
          $scope.isLoading = false;
          $scope.$broadcast('alert.AlertIssued', {
            type: 'danger',
            message: error.error
          });
        });
    };
    /* 
     * reloads the work realted objects workObj
     */
    $scope.reloadWork = function() {
      $scope.workSteps = [];
      getWork($scope.workObj.id);
    }
    if ($scope.workObj) {
      getWork($scope.workObj.id);
    }
    $scope.$watch('workObj', function(newValue, oldValue) {
      if (newValue !== oldValue && newValue !== null) {
        getWork(newValue.id);
      }
    })
    /**
     * JavaScript format string function
     *
     */
    String.prototype.format = function() {
      var args = arguments;

      return this.replace(/{(\d+)}/g, function(match, number) {
        return typeof args[number] != 'undefined' ? args[number] :
          '{' + number + '}';
      });
    };


    /**
     * Convert a Javascript Oject array or String array to an HTML table
     * JSON parsing has to be made before function call
     * It allows use of other JSON parsing methods like jQuery.parseJSON
     * http(s)://, ftp://, file:// and javascript:; links are automatically computed
     *
     * JSON data samples that should be parsed and then can be converted to an HTML table
     *     var objectArray = '[{"Total":"34","Version":"1.0.4","Office":"New York"},{"Total":"67","Version":"1.1.0","Office":"Paris"}]';
     *     var stringArray = '["New York","Berlin","Paris","Marrakech","Moscow"]';
     *     var nestedTable = '[{ key1: "val1", key2: "val2", key3: { tableId: "tblIdNested1", tableClassName: "clsNested", linkText: "Download", data: [{ subkey1: "subval1", subkey2: "subval2", subkey3: "subval3" }] } }]';
     *
     * Code sample to create a HTML table Javascript String
     *     var jsonHtmlTable = ConvertJsonToTable(eval(dataString), 'jsonTable', null, 'Download');
     *
     * Code sample explaned
     *  - eval is used to parse a JSON dataString
     *  - table HTML id attribute will be 'jsonTable'
     *  - table HTML class attribute will not be added
     *  - 'Download' text will be displayed instead of the link itself
     
     * @class ConvertJsonToTable
     *
     * @method ConvertJsonToTable
     *
     * @param parsedJson object Parsed JSON data
     * @param tableId string Optional table id
     * @param tableClassName string Optional table css class name
     * @param linkText string Optional text replacement for link pattern
     *
     * @return string Converted JSON to HTML table
     */
    function ConvertJsonToTable(parsedJson, tableId, tableClassName, linkText) {
      //Patterns for links and NULL value
      var italic = '<i>{0}</i>';
      var link = linkText ? '<a href="{0}">' + linkText + '</a>' :
        '<a href="{0}">{0}</a>';

      //Pattern for table                          
      var idMarkup = tableId ? ' id="' + tableId + '"' :
        '';

      var classMarkup = tableClassName ? ' class="' + tableClassName + '"' :
        '';

      var tbl = '<table border="1" cellpadding="1" cellspacing="1"' + idMarkup + classMarkup + '>{0}{1}</table>';

      //Patterns for table content
      var th = '<thead>{0}</thead>';
      var tb = '<tbody>{0}</tbody>';
      var tr = '<tr>{0}</tr>';
      var thRow = '<th>{0}</th>';
      var tdRow = '<td>{0}</td>';
      var thCon = '';
      var tbCon = '';
      var trCon = '';

      if (parsedJson) {
        var isStringArray = typeof(parsedJson[0]) == 'string';
        var headers;

        // Create table headers from JSON data
        // If JSON data is a simple string array we create a single table header
        if (isStringArray)
          thCon += thRow.format('value');
        else {
          // If JSON data is an object array, headers are automatically computed
          if (typeof(parsedJson[0]) == 'object') {
            headers = array_keys(parsedJson[0]);

            for (i = 0; i < headers.length; i++)
              thCon += thRow.format(headers[i]);
          }
        }
        th = th.format(tr.format(thCon));

        // Create table rows from Json data
        if (isStringArray) {
          for (i = 0; i < parsedJson.length; i++) {
            tbCon += tdRow.format(parsedJson[i]);
            trCon += tr.format(tbCon);
            tbCon = '';
          }
        } else {
          if (headers) {
            var urlRegExp = new RegExp(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig);
            var javascriptRegExp = new RegExp(/(^javascript:[\s\S]*;$)/ig);

            for (i = 0; i < parsedJson.length; i++) {
              for (j = 0; j < headers.length; j++) {
                var value = parsedJson[i][headers[j]];
                var isUrl = urlRegExp.test(value) || javascriptRegExp.test(value);

                if (isUrl) // If value is URL we auto-create a link
                  tbCon += tdRow.format(link.format(value));
                else {
                  if (value) {
                    if (typeof(value) == 'object') {
                      //for supporting nested tables
                      tbCon += tdRow.format(ConvertJsonToTable(eval(value.data), value.tableId, value.tableClassName, value.linkText));
                    } else {
                      tbCon += tdRow.format(value);
                    }

                  } else { // If value == null we format it like PhpMyAdmin NULL values
                    tbCon += tdRow.format(italic.format(value).toUpperCase());
                  }
                }
              }
              trCon += tr.format(tbCon);
              tbCon = '';
            }
          }
        }
        tb = tb.format(trCon);
        tbl = tbl.format(th, tb);

        return tbl;
      }
      return null;
    }


    /**
     * Return just the keys from the input array, optionally only for the specified search_value
     * version: 1109.2015
     *  discuss at: http://phpjs.org/functions/array_keys
     *  *     example 1: array_keys( {firstname: 'Kevin', surname: 'van Zonneveld'} );
     *  *     returns 1: {0: 'firstname', 1: 'surname'}
     */
    function array_keys(input, search_value, argStrict) {
      var search = typeof search_value !== 'undefined',
        tmp_arr = [],
        strict = !!argStrict,
        include = true,
        key = '';

      if (input && typeof input === 'object' && input.change_key_case) { // Duck-type check for our own array()-created PHPJS_Array
        return input.keys(search_value, argStrict);
      }

      for (key in input) {
        if (input.hasOwnProperty(key)) {
          include = true;
          if (search) {
            if (strict && input[key] !== search_value)
              include = false;
            else if (input[key] != search_value)
              include = false;
          }
          if (include)
            tmp_arr[tmp_arr.length] = key;
        }
      }
      return tmp_arr;
    }

  }
]);