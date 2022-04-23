/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

var PAGE_SIZE = 20;
var SEARCH_ID = 'customsearch_sdb_po_pending_approval';
var CLIENT_SCRIPT_FILE_ID = 'SuiteScripts/SDB_po_pending_approval_CS.js';

define(['N/ui/serverWidget', 'N/search', 'N/redirect', 'N/url'],
    function (serverWidget, search, redirect, url) {
        function onRequest(context) {
            if (context.request.method == 'GET') {
                var form = serverWidget.createForm({
                    title: 'Aprobación de orden de compra',
                    hideNavBar: false
                });

                var jsonSelected = form.addField({ id: 'custpage_jsonselected', type: 'LONGTEXT', label: 'jsonSelected' });
                jsonSelected.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });

                var subsidiaryselect = form.addField({ id: 'custpage_subsidiary', type: 'SELECT', label: 'SUBSIDIARIAS', source: 'subsidiary' });
                // subsidiaryselect.updateDisplayType({
                //     displayType: serverWidget.FieldDisplayType.HIDDEN
                // });
                form.clientScriptModulePath = CLIENT_SCRIPT_FILE_ID;

                // Get parameters
                var pageId = parseInt(context.request.parameters.page);
                var subsidiary = context.request.parameters.subsidiary;
                var scriptId = context.request.parameters.script;
                var deploymentId = context.request.parameters.deploy;

                if (subsidiary){
                    subsidiaryselect.defaultValue = subsidiary;
                }

                    // Add sublist that will show results
                    var sublist = form.addSublist({
                        id: 'custpage_table',
                        type: serverWidget.SublistType.LIST,
                        label: 'Purchase orders'
                    });

                // Run search and determine page count
                var retrieveSearch = runSearch(SEARCH_ID, PAGE_SIZE, subsidiary);
                var pageCount = Math.ceil(retrieveSearch.count / PAGE_SIZE);
                var columns = retrieveSearch.searchDefinition.columns;

                sublist.addField({
                    id: 'custpage_select',
                    label: 'Aprobar',
                    type: serverWidget.FieldType.CHECKBOX
                });

                sublist.addField({
                    id: 'custpage_id',
                    label: 'internalid',
                    type: serverWidget.FieldType.TEXT
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });

                for (var i = 0; i < columns.length; i++) {
                    var column = columns[i];
                    sublist.addField({
                        id: 'column' + i,
                        type: serverWidget.FieldType.TEXT,
                        label: column.label
                    });
                }
                // Set pageId to correct value if out of index
                if (!pageId || pageId == '' || pageId < 0)
                    pageId = 0;
                else if (pageId >= pageCount)
                    pageId = pageCount - 1;

                // Add buttons to simulate Next & Previous
                if (pageId != 0) {
                    form.addButton({
                        id: 'custpage_previous',
                        label: 'Anterior',
                        functionName: 'getSuiteletPage(' + scriptId + ', ' + deploymentId + ', ' + (pageId - 1) + ')'
                    });
                }

                if (pageId != pageCount - 1) {
                    form.addButton({
                        id: 'custpage_next',
                        label: 'Siguiente',
                        functionName: 'getSuiteletPage(' + scriptId + ', ' + deploymentId + ', ' + (pageId + 1) + ')'
                    });
                }

                if (retrieveSearch.count > 0) {
                    form.addButton({
                        id: 'custpage_selectAll',
                        label: 'Seleccionar todas',
                        functionName: 'selectAll(' + retrieveSearch.count + ')'
                    });
                }

                form.addSubmitButton({
                    label: 'Aprobar'
                })

                // Add drop-down and options to navigate to specific page
                var selectOptions = form.addField({
                    id: 'custpage_pageid',
                    label: 'Page Index',
                    type: serverWidget.FieldType.SELECT
                });

                for (var i = 0; i < pageCount; i++) {
                    if (i == pageId) {
                        selectOptions.addSelectOption({
                            value: 'pageid_' + i,
                            text: ((i * PAGE_SIZE) + 1) + ' - ' + ((i + 1) * PAGE_SIZE),
                            isSelected: true
                        });
                    } else {
                        selectOptions.addSelectOption({
                            value: 'pageid_' + i,
                            text: ((i * PAGE_SIZE) + 1) + ' - ' + ((i + 1) * PAGE_SIZE)
                        });
                    }
                }

                // Get subset of data to be shown on page
                var addResults = fetchSearchResult(retrieveSearch, pageId);
                addResults.forEach(function (result, j) {
                    sublist.setSublistValue({
                        id: 'custpage_id',
                        line: j,
                        value: result[0],
                    });
                    result.splice(0, 1);
                    result.forEach(function (value, i) {
                        if (value) {
                            sublist.setSublistValue({
                                id: 'column' + i,
                                line: j,
                                value: value,
                            });
                        }
                    })
                });
                context.response.writePage(form);
            } else if (context.request.method == 'POST') {
                redirect.toSuitelet({
                    scriptId: 'customscript_sdb_po_pending_approval',
                    deploymentId: 'customdeploy_sdb_po_pending_approval',
                })
            }
        }

        return {
            onRequest: onRequest
        };

        function runSearch(searchId, searchPageSize, subsidiary) {
            var searchObj = search.load({
                id: searchId
            });
            if (subsidiary) {
                var filters = searchObj.filters;
                var subsidiaryFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.IS,
                    values: subsidiary
                });
                filters.push(subsidiaryFilter);
            }
            return searchObj.runPaged({
                pageSize: searchPageSize
            });
        }

        function fetchSearchResult(pagedData, pageIndex) {
            if (pagedData.count == 0) return [];

            var searchPage = pagedData.fetch({
                index: pageIndex
            });
            var columns = pagedData.searchDefinition.columns;
            var results = new Array();
            searchPage.data.forEach(function (result) {
                var values = [];
                values.push(result.id);
                for (var i = 0; i < columns.length; i++) {
                    var value = result.getText(columns[i]);
                    if (!value) {
                        value = result.getValue(columns[i]);
                    }
                    values.push(value);
                }
                results.push(values);

            });
            return results;
        }
    });
