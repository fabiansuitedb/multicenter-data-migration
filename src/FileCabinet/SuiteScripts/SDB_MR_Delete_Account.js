/**
 *@NApiVersion 2.0
 *@NScriptType mapreducescript

 */
 define(['N/search', 'N/record', 'N/log', 'N/runtime'],

 function (search, record, log, runtime) {


     return {

         getInputData: function (context) {
             try {
                //  var scriptObj = runtime.getCurrentScript();
                //  var searchId = scriptObj.getParameter({ name: 'custscript_bit_search_id' })
                //  if (!searchId) return
                 try {
                     var mySearch = search.load({
                         id: 165
                     });
                 } catch (e) {
                     log.debug({
                         title: 'Error in getInputData',
                         details: e
                     })
                 }
             } catch (e) {
                 log.debug({ title: 'error getInputData ', details: JSON.stringify(e) });
             }
             return mySearch;
         },

         map: function (context) {
             try {
                  log.debug({ title: 'context.value', details: JSON.parse(context.value) });
                 var object = {};
                 var valuesEntry = JSON.parse(context.value);
                 var accountType = valuesEntry.recordType;
                 var account = valuesEntry.id;
                 var isparent=valuesEntry.values["custrecord_sdb_is_parent"];
                 log.debug({ title: 'valuesEntry', details: context.value });
                 log.debug({ title: 'accountType', details: accountType });
                 log.debug({ title: 'account', details:account });
                 log.debug({ title: 'isparent', details: isparent });
               if(isparent == 'F') record.delete({type:accountType, id: account})

             } catch (e) {
                 log.debug({ title: 'error map', details: JSON.stringify(e) });
             }

             context.write({
                key: context.key,
                value: context.value
            });
         },

         reduce: function (context) {
             try {
                 log.debug({ title: ' reduce key', details: context.key });
                
                 log.debug({ title: ' reduce key', details:context.values[0]});
                 var objItem = JSON.parse(context.values[0]);
                 log.debug({ title: ' objItem.values.custrecord_sdb_is_parent', details:objItem.values["custrecord_sdb_is_parent"] });
                 log.debug({ title: ' objItem.recordType', details:objItem.recordType });
                 log.debug({ title: '  objItem.id', details: objItem.id });

                 if (objItem.values["custrecord_sdb_is_parent"] == 'T') {
                  record.delete({type:objItem.recordType, id: objItem.id});
                 }
             } catch (e) {
                 log.error({
                     title: 'ERROR reduce',
                     details: 'ERROR ' + JSON.stringify(e)
                 })
             }
         },

         summarize: function (context) {
             try {
                 log.debug({ title: 'context summarize', details: context });
                 context.output.iterator().each(function (key, value) {
                     return true;
                 });
             } catch (e) {
                 log.error({
                     title: 'summarize',
                     details: 'ERROR ' + JSON.stringify(e)
                 })
             }
         }
     }

     



 });