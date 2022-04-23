/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
define(['N/file', 'N/https', 'N/task', 'N/record', 'N/task', 'N/runtime'],
    function (file, https, task, record, task, runtime) {
        function execute(context) {
            var content = getCurrencyFile();
            content = content.split("<strong>Bs</strong>")[1].split('&nbsp;&nbsp;')[0]
			var scriptObj = runtime.getCurrentScript();
            var folderId =  scriptObj.getParameter({name: 'custscript_folder_data'});
            //csvLine represents a line of comma separated values of price information

            var mappingFileId = "custimport_sdb_exchange_ufv"; // this references a saved CSV import map with header info below

            // add a header to the import
            var primaryFileAsString = "Base Currency,Currency,Exchange Rate,Effective Date\n";
            var date = new Date();
            primaryFileAsString += "Boliviano"  + ", "; // BOL        
            primaryFileAsString += "UFV" + ", "; // UFV
            primaryFileAsString += content.replace(",", ".") + ", "; // rate
            primaryFileAsString += date.getDate()+"/"+(date.getMonth()+1)+"/"+date.getFullYear() + "\n"; // date

            var fileObject = file.create({
                name: 'cotizacion.csv',
                fileType: file.Type.CSV,
                contents: primaryFileAsString,
                description: 'Cotizations from UFV',
                folder: folderId,
                isOnline: true
            })
            var id = fileObject.save();
            var mappingFieldId = 2;
            var primaryFile = file.load({
                id: id
            });

            var job = task.create({
                taskType: task.TaskType.CSV_IMPORT
            });

            job.mappingId = mappingFileId;
            job.importFile = primaryFile;
            job.name = 'CotizationsFromUFV';

            var jobId = job.submit();
            log.audit("id jobId: ", jobId);
            var myRec = record.create({
              type: 'customrecord_sdb_ufv_calculo_diario'
            })
            myRec.setValue({
              fieldId: 'custrecord_sdb_ufv_cambio',
              value: content.replace(",", ".")
            });
          myRec.setValue({
              fieldId: 'custrecord_sdb_date_ufv',
              value: new Date()
            });
          
          var myId = myRec.save();
          log.audit("id date: ",  myId);
          var mapReduceScriptId = 'customscript_sdb_create_ufv_reports';
          var mrTask = task.create({
            taskType: task.TaskType.MAP_REDUCE,
            scriptId: mapReduceScriptId,
            deploymentId: 'customdeploy1'
        	});
          //var mrTaskId = mrTask.submit();
        }
        function getCurrencyFile() {
            var url = 'https://suitedb.com/ufv-request.php';

            var responseP = https.get({
                url: url
            });
            log.audit("getMediaFilesByUrl results: ", responseP.body)
            return responseP.body;
        }
        return {
            execute: execute
        };
    });