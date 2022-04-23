/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
 define(["N/record", "N/file"], function(record,file) {

  function beforeLoad(context) {
  try{
          var rec = context.newRecord;
        
          var form_1=context.form;
          var sublist= form_1.getSublist({
              id: 'expense'
          })
          
          var subtextfield = sublist.addField({
            id: 'custpage_checkbox',
            type: 'checkbox',
            label: 'Cuota saldada'
        });

      }catch(error){
        log.debug('error', error);
      }
  }

  return {
      beforeLoad: beforeLoad,
      //beforeSubmit: beforeSubmit,
     // afterSubmit: afterSubmit
  }
});
