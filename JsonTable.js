(function($) {
  $.fn.JsonTable = async function(options) {
    // style
    $("head").append('<link rel="stylesheet" type="text/css" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css">');
    $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-multiselect/0.9.15/css/bootstrap-multiselect.css">');
    $("head").append('<link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.20/css/dataTables.bootstrap4.min.css"/>');
    $("head").append('<link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/buttons/1.6.1/css/buttons.dataTables.min.css"/>');
    $("head").append('<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.2/css/all.css">');
    $("head").append('<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/jamieoneill/JsonTable/style.css">');

    //script
    await $.getScript("https://cdn.jsdelivr.net/npm/sweetalert2@9");
    showLoading();
    await $.getScript("https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js");
    await $.getScript("https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js");
    await $.getScript("https://cdnjs.cloudflare.com/ajax/libs/bootstrap-multiselect/0.9.15/js/bootstrap-multiselect.js");
    await $.getScript("https://cdn.datatables.net/v/dt/dt-1.10.20/datatables.min.js");
    await $.getScript("https://cdn.datatables.net/buttons/1.6.1/js/dataTables.buttons.min.js");
    await $.getScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.3/jszip.min.js");
    await $.getScript("https://cdn.datatables.net/buttons/1.6.1/js/buttons.html5.min.js");

    var settings = $.extend(
      {
        DivID: "#" + $(this)[0].id,
        colsToHide: []
      },
      options
    );
    await createTableLayout();

    var allData;
    var columns = [];
    var activeFilters = [];
    var firstFilter = true;
    var dataTable;

    if (settings.dataURL) {
      getData();
    } else {
      setTableData(settings.data);
    }

    function getData() {
      $.ajax(settings.dataURL, {
        method: "GET",
        headers: {
          authorization: settings.token
        }
      })
        .then(function(data) {
          if(settings.responseField){
            content = data[settings.responseField];

            //for git data
            if(settings.dataURL.includes("github")){
              allData = JSON.parse(atob(content));
              gitSha = data.sha;
            }else{
              allData = content;
            }

          }else{
            allData = data;
          }
 
          var tempArray = [];
          if (Array.prototype.isArray(allData)) {
            tempArray = allData;
          } else {
            tempArray.push(allData);
          }
          allData = tempArray

          setTableData(allData);
        })
        .catch(function(error) {
          console.error(error);
        });
    }

    async function createTableLayout() {
      var layout = `
      <div class="row" style="margin-bottom: 15px">          
        <div class="col-md-12">
            <div class="card">
                <div class="card-header">
                    Filter 
                </div>
                <div class="card-body">
                    <form id="filtHolder"></form>
                    <button class="btn btn-primary" id="addFilter">+ Filter</button> 
                    <button class="btn btn-danger" id="clearFilters">Clear All</button>                                               
                </div>
            </div>
        </div>
    </div>

    <div class="row">            
        <div class="col-md-12" >
            <table id="jsonTable" class="table table-bordered table-hover">
                <thead></thead>
                <tbody></tbody>
            </table>
        </div>
    </div>`;

      $(settings.DivID).append(layout);
    }

    function setTableData(json) {
      if (dataTable) {
        //clear for reload
        dataTable.destroy();
        $("#jsonTable tr").remove();
      }

      // headers
      var row = "<tr>";
      Object.keys(json[0]).forEach(function(header, i) {
        columns.push(header);

        if ($.inArray(header, settings.colsToHide) != -1) {
          row +=
            '<th style="display:none" class="Col-' +
            i +
            '">' +
            header +
            "</th>";
        } else {
          row += '<th class="Col-' + i + '">' + header + "</th>";
        }
      });
      row += "</tr>";
      $("#jsonTable thead").append(row);

      // rows
      json.forEach(function(project, rowIndex) {
        var row = '<tr id="row-' + rowIndex + '">';

        for (const [i, [key, value]] of Object.entries(
          Object.entries(project)
        )) {
          flattenedValue = flatten(value);

          if (Object.keys(flattenedValue).length > 1) {
            if ($.inArray(key, settings.colsToHide) != -1) {
              row += '<td class="Col-' + i + '"  style="display:none">';
            } else {
              row += '<td class="Col-' + i + '">';
            }

            for (const key in flattenedValue) {
              if (flattenedValue.hasOwnProperty(key)) {
                //row += ''+ key + ": " +  flattenedValue[key] +'<hr>';
                row += flattenedValue[key] + ' <hr class="small">';
              }
            }
            row += "</td>";
          } else {
            if ($.inArray(key, settings.colsToHide) != -1) {
              row +=
                '<td class="Col-' +
                i +
                '" style="display:none">' +
                Object.values(flattenedValue)[0] +
                "</td>";
            } else {
              row +=
                '<td class="Col-' +
                i +
                '">' +
                Object.values(flattenedValue)[0] +
                "</td>";
            }
          }
        }

        row += "</tr>";
        $("#jsonTable tbody").append(row);
      });

      //set sorting
      dataTable = $("#jsonTable").DataTable({
        paging: false,
        info: false,
        dom: "Bfrtip",
        buttons: [
          {
            extend: "excelHtml5",
            text: "Export",
            className: "btn",
            exportOptions: {
              columns: ":visible"
            }
          }
        ]
      });

      setDisplayCols();
      closeLoading();
    }

    function flatten(data) {
      var result = {};
      function recurse(cur, prop) {
        if (Object(cur) !== cur) {
          result[prop] = cur;
        } else if (Array.prototype.isArray(cur)) {
          for (var i = 0, l = cur.length; i < l; i++)
            recurse(cur[i], prop ? prop + "." + i : "" + i);
          // recurse(cur[i], prop ? prop+"" : "");

          if (l == 0) result[prop] = [];
        } else {
          var isEmpty = true;
          for (var p in cur) {
            isEmpty = false;
            recurse(cur[p], prop ? prop + "." + p : p);
          }
          if (isEmpty) result[prop] = {};
        }
      }
      recurse(data, "");
      return result;
    }

    $("#clearFilters").click(function() {
      var myNode = document.getElementById("filtHolder");
      while (myNode.firstChild) {
        myNode.removeChild(myNode.lastChild);
      }
      firstFilter = true;
      activeFilters = [];
      $("jsonTable tbody tr").show();
    });

    $("#addFilter").click(function() {
      var newID = Math.floor(Math.random() * 10000);

      var div = document.createElement("div");
      div.className = "row";

      if (!firstFilter) {
        var col0 = document.createElement("div");
        col0.className = "col-md-1";
        var selectList0 = document.createElement("select");
        selectList0.className = "form-control";
        selectList0.id = "query-" + newID;
        var optionAnd = document.createElement("option");
        optionAnd.value = "AND";
        optionAnd.text = "AND";
        selectList0.appendChild(optionAnd);
        var optionOR = document.createElement("option");
        optionOR.value = "OR";
        optionOR.text = "OR";
        selectList0.appendChild(optionOR);
        col0.appendChild(selectList0);
        div.appendChild(col0);
      } else {
        var col0 = document.createElement("div");
        col0.className = "col-md-1";
        var selectList0 = { value: "OR" };
        div.appendChild(col0);
      }
      firstFilter = false;

      var col1 = document.createElement("div");
      col1.className = "col-md-5";

      var selectList1 = document.createElement("select");
      selectList1.className = "form-control";
      selectList1.id = "filter-" + newID;
      //Create and append the options
      for (var i = 0; i < columns.length; i++) {
        var option = document.createElement("option");
        option.value = i;
        option.text = columns[i];
        selectList1.appendChild(option);
      }

      col1.appendChild(selectList1);
      div.appendChild(col1);

      var col2 = document.createElement("div");
      col2.className = "col-md-5";

      var selectList2 = document.createElement("select");
      selectList2.setAttribute("multiple", "multiple");
      selectList2.id = "options-" + newID;
      $.each(allData, function(i, innerData) {
        var option = document.createElement("option");
        option.value = Object.values(innerData)[0];
        option.text = Object.values(innerData)[0];
        selectList2.appendChild(option);
      });

      col2.appendChild(selectList2);
      div.appendChild(col2);

      document.getElementById("filtHolder").appendChild(div);

      $("#options-" + newID).multiselect({
        enableFiltering: true,
        filterBehavior: "text",
        includeResetOption: true,
        includeResetDivider: true,
        resetText: "Clear",
        buttonWidth: "400px",
        buttonContainer: '<div class="dropdown" />',
        templates: {
          li:
            '<li class="dropdown-item"><a><label class="m-0 pl-2 pr-0"></label></a></li>',
          ul: '<ul class="multiselect-container dropdown-menu p-1 m-0"></ul>'
        },
        onChange: function(option, checked) {
          var filterValues = [];
          $("#options-" + newID + " option:selected").each(function() {
            filterValues.push($(this).val());
          });

          thisFilter = {
            col: selectList1.value,
            values: filterValues,
            query: selectList0.value
          };
          setActiveFilters(thisFilter);
        }
      });

      refreshChange();
    });

    function setActiveFilters(newFilter) {
      $("#jsonTable tbody tr").hide();

      //check if existing filter has been updated
      activeFilters.forEach(function(element, i) {
        if (element.col === newFilter.col) {
          activeFilters.splice(i, 1);
        }
      });

      activeFilters.push(newFilter);

      $("#jsonTable tbody tr").each(function() {
        row = $(this);
        activeFilters.forEach(function(element, i) {
          if (element.values.length == 0) {
            activeFilters.splice(i, 1);
          } else {
            td = row.find("td.Col-" + element.col)[0];

            if (element.query == "OR") {
              if (td.innerHTML.includes('<hr class="small">')) {
                found = element.values.some(r =>
                  td.textContent.split(" ").includes(r)
                );
              } else {
                found = element.values.includes(td.textContent);
              }

              if (found) {
                row.show();
              }
            } else if (element.query == "AND") {
              //only run and query on visible rows
              if (row.is(":visible")) {
                if (td.innerHTML.includes('<hr class="small">')) {
                  found = element.values.some(r =>
                    td.textContent.split(" ").includes(r)
                  );
                } else {
                  found = element.values.includes(td.textContent);
                }

                if (!found) {
                  row.hide();
                }
              }
            }
          }
        });
      });

      //no filters
      if (activeFilters.length == 0) {
        $("#jsonTable tbody tr").show();
      }
    }

    $("#jsonTable").on("click", "tbody tr", function() {
      rowID = $(this)[0].id.replace("row-", "");

      if(settings.dataURL.includes("github")){
        showUploadButton = true
      }else{
        showUploadButton = false
      }

      (async () => {
        const { value: formValues } = await Swal.fire({
          title: "<strong>Details</strong>",
          html: makeDetailTable(rowID),
          width: "70%",
          showCancelButton: true,
          showConfirmButton: showUploadButton,
          confirmButtonColor: "#3085d6",
          confirmButtonText: "Update",
          cancelButtonColor: "#d33",
          cancelButtonText: "Close",
          focusConfirm: false,
          preConfirm: () => {
            return [$(".updateProject" + rowID)];
          }
        });

        if (formValues) {
          updatedProject = {};

          //add updated values to new object
          formValues[0].each(function() {
            array = $(this)
              .attr("keyName")
              .split(".");
            assign(updatedProject, array, $(this).val());
          });

          //replace project with updated
          allData[rowID] = updatedProject;

          uploadToGit(allData);
          setTableData(allData);
        }
      })();
    });

    function makeDetailTable(rowID) {

      newTable = '<table id="tempTable" class="table table-bordered"> <tbody>';
      flattenedValue = flatten(allData[rowID]);

      for (const key in flattenedValue) {
        if (flattenedValue.hasOwnProperty(key)) {
          newTable +=
            "<tr><td>" +
            key +
            '</td><td><input class="form-control updateProject' +
            rowID +
            '" keyName="' +
            key +
            '" value="' +
            flattenedValue[key] +
            '"></input></td></tr>';
        }
      }
      newTable += "</tbody></table>";

      return newTable;
    }

    function refreshChange() {
      $("*[id*=filter]").change(function() {
        optionsID = $(this)[0].id.replace("filter", "options");
        optionsCategory = parseInt($(this).val());
        newValues = [];

        $.each(allData, function(i, innerData) {
          thisValue = Object.values(innerData)[optionsCategory];

          if (newValues.indexOf(thisValue) === -1) {
            newValues.push(thisValue);
          }
        });

        $("#" + optionsID)
          .empty()
          .populate(newValues);
        $("#" + optionsID).multiselect("rebuild");
      });
    }

    function setDisplayCols() {
      var label = document.createElement("label");
      label.textContent = "Display: ";
      label.style.marginRight = "10px";

      var selectList = document.createElement("select");
      selectList.setAttribute("multiple", "multiple");
      selectList.id = "colSelector";
      //Create and append the options
      for (var i = 0; i < columns.length; i++) {
        var option = document.createElement("option");
        option.value = i;
        option.text = columns[i];

        //apply all cols not hidden
        if (!settings.colsToHide.includes(columns[i])) {
          option.setAttribute("selected", "selected");
        }

        selectList.appendChild(option);
      }

      label.appendChild(selectList);
      $("#jsonTable_filter").prepend(label);

      $("#colSelector").multiselect({
        templates: {
          li:
            '<li class="dropdown-item"><a><label class="m-0 pl-2 pr-0"></label></a></li>',
          ul: '<ul class="multiselect-container dropdown-menu p-1 m-0"></ul>'
        },
        onChange: function(option, show) {
          colID = option[0].value;

          var items = document.getElementsByClassName("Col-" + colID);
          for (var i = 0; i < items.length; i++) {
            if (show) {
              $(items[i]).show();
            } else {
              $(items[i]).hide();
            }
          }
        }
      });

      //add class for search box
      $("#jsonTable_filter").children()[1].children[0].className =
        "form-control";
    }

    function showLoading() {
      Swal.fire({
        title: "Fetching data",
        timerProgressBar: true,
        onBeforeOpen: () => {
          Swal.showLoading();
        },
        allowOutsideClick: false
      }).then(result => {});
    }

    function closeLoading(reason) {
      Swal.close();

      //display an error if any
      switch (reason) {
        case "No version files found on Github":
          Swal.fire("Error", reason, "error");
          break;
        default:
          break;
      }
    }

    function assign(obj, keyPath, value) {
      lastKeyIndex = keyPath.length - 1;
      for (var i = 0; i < lastKeyIndex; ++i) {
        key = keyPath[i];
        if (!(key in obj)) {
          obj[key] = {};
        }
        obj = obj[key];
      }
      obj[keyPath[lastKeyIndex]] = value;
    }

    function uploadToGit(content) {
      var updatedContent = btoa(JSON.stringify(content));
      var commitData =
        '{"message":"adding new project","content":"' +
        updatedContent +
        '","sha":"' +
        gitSha +
        '", "branch": "master"}';

      //update the project data file
      $.ajax({
        url: settings.dataURL,
        type: "PUT",
        beforeSend: function(xhr) {
          xhr.setRequestHeader("Authorization", settings.token);
        },
        data: commitData
      })
        .then(function(data) {
          Swal.fire("Success", "data uploaded", "success");
        })
        .catch(function(error) {
          if(!settings.token){
            Swal.fire(
              "Error",
              "No git token has been set",
              "error"
            );
          }else{
          Swal.fire(
            "Error",
            "Something went wrong. view console for more details",
            "error"
          );
        }
          console.error(error);
        });
    }

    (function($) {
      // Populates a select drop-down with options in a list
      $.fn.populate = function(list) {
        var hasObject = false;

        //check if nested object
        list.forEach(element => {
          if (typeof element === "object") {
            hasObject = true;
          }
        });

        if (hasObject) {
          //add groups
          Object.keys(list[0]).forEach(element => {
            return this.append(
              $(
                '<optgroup name="' +
                  $(this)[0].id +
                  element +
                  '" label="' +
                  element +
                  '">'
              )
            );
          });

          list.forEach(element => {
            for (const key in element) {
              values = [];

              if (Array.prototype.isArray(element[key])) {
                //array
                //inner object
                if (typeof element[key][0] === "object") {
                  Object.entries(element[key][0]).forEach(innerElement => {
                    createOptions(
                      [innerElement[1]],
                      key + "-" + innerElement[0],
                      this
                    );
                  });
                } else {
                  //inner array
                  createOptions(element[key], key, this);
                }
              } else if (typeof element[key] === "object") {
                //object
                Object.entries(element[key]).forEach(innerElement => {
                  //inner array
                  if (Array.prototype.isArray(innerElement[1])) {
                    //inner array will have objects
                    innerElement[1].forEach(arrayValue => {
                      Object.entries(arrayValue).forEach(finalObject => {
                        createOptions(
                          [finalObject[1]],
                          innerElement[0] + "-" + finalObject[0],
                          this
                        );
                      });
                    });
                  } else {
                    //inner object
                    createOptions([innerElement[1]], innerElement[0], this);
                  }
                });
              } else {
                //single sting
                createOptions([element[key].toString()], key, this);
              }
            }
          });
        } else {
          //add plain option
          return this.append(
            list.map(item =>
              $("<option>", {
                text: item,
                value: item
              })
            )
          );
        }

        //remove empty groups
        $("optgroup").each(function() {
          if ($(this).children().length == 0) {
            $(this).remove();
          }
        });
      };

      function createOptions(values, label, div) {
        values.forEach(value => {
          var duplicate = false;

          if (value != "") {
            //  if(label.match(/^\d/)){
            //      label  = label.substring(2);
            //  }

            //create group for sub options
            if (
              $('optgroup[name="' + div[0].id + "" + label + '"]').length == 0
            ) {
              div.append(
                $(
                  '<optgroup name="' +
                    div[0].id +
                    "" +
                    label +
                    '" label="' +
                    label +
                    '">'
                )
              );
            }

            //add first option
            if (
              $('optgroup[name="' + div[0].id + "" + label + '"] option')
                .length == 0
            ) {
              $('optgroup[name="' + div[0].id + "" + label + '"]').append(
                $("<option>", {
                  text: value,
                  value: value
                })
              );
            } else {
              //check for duplicate options
              $('optgroup[name="' + div[0].id + "" + label + '"] option').each(
                function() {
                  if ($(this).val() == value) {
                    duplicate = true;
                  }
                }
              );

              //append options to correct group
              if (!duplicate) {
                $('optgroup[name="' + div[0].id + "" + label + '"').append(
                  $("<option>", {
                    text: value,
                    value: value
                  })
                );
              }
            }
          }
        });
      }
    })(jQuery);
  }; //end main
})(jQuery);
