/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['N/record', 'N/search'], function (record, search) {
    function onAction(scriptContext) {

        var newRecord = scriptContext.newRecord;
       
        var location = newRecord.getValue({
		fieldId: 'location'
        })
         log.debug("id location: ", location);
        var trecord = record.transform({
            fromType: record.Type.SALES_ORDER,
            fromId: newRecord.id,
            toType: record.Type.ITEM_FULFILLMENT
        });
      trecord.setValue({
                            fieldId: 'shipstatus',
                            value: 'C'
                        })

        var itemCount = trecord.getLineCount({
            sublistId: 'item'
        });

        for (var i = 0; i < itemCount; i++) {

            var qty = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                line: i
            });
            var itemId = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: i
            });
         
                // var location = newRecord.getSublistValue({
                //     sublistId: 'item',
                //     fieldId: 'location',
                //     line: i
                // }) || 1;
                trecord.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'itemreceive',
                    line: i,
                    value: true
                });

                trecord.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'itemquantity',
                    value: qty,
                    line: i
                });
                 trecord.setSublistValue({
                     sublistId: 'item',
                     fieldId: 'location',
                     value: location,
                     line: i
                 });
                trecord.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantitycommitted',
                    line: i,
                    value: qty
                });
                
                var subrec = trecord.getSublistSubrecord({
                    sublistId: 'item',
                    fieldId: 'inventorydetail',
                    line: i
                });
                log.debug("id subrec: ", subrec);
                var itemCountChilds = subrec.getLineCount({
                    sublistId: 'inventoryassignment'
                });
                log.debug("id itemCountChilds: ", itemCountChilds);
                for (var x = 0; x < itemCountChilds; x++) {
                    subrec.setSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'quantity',
                        value: qty,
                        line: x
                    });
                    subrec.setSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'inventorystatus',
                        value: 1,
                        line: x
                    });
                }
            
        }
        trecord.save();
    }

    function getItemsAvailables(newRecord) {
        let myItems = [];
        var mySearch = search.load({
            id: 'customsearch_sdb_items_stock'
        });
        /*
        * Add a new filter to the existing filters array
        * */
        var defaultFilters = mySearch.filters;
        var custFilter1 = search.createFilter({
            name: 'internalid',
            operator: search.Operator.IS,
            values: [newRecord.id]
        });
        defaultFilters.push(custFilter1);
        mySearch.filters = defaultFilters;

        mySearch.run().each(function (result) {
            log.debug('result.column ', result.columns)
            var quantityavailable = result.getValue(result.columns[1]);
            var itemId = result.getValue({
                name: 'item'
            });
            myItems.push({
                itemId: itemId,
                quantityavailable: quantityavailable
            })
            return true;
        });
        return myItems;
    }
    return {
        onAction: onAction
    }
});