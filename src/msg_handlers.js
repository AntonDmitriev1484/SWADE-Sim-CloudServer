import fs from "fs"
import  * as f from "./fetch_methods.js"
import FormData from "form-data"


function build_file_upload_handler(file_upload_endpoint, req, res) {
    let writestream = null;
    let path = null;
    let END = false;
    let COUNT = 0;

    function end_file_transfer() {
        console.log('Closing writestream');

        writestream.end();
        writestream = null;
        const file = fs.createReadStream(path);
        path = null;

        console.log(' Cloud read: '+COUNT+' chunks. ');
        COUNT = 0;

        const formData = new FormData();
        formData.append('file', file); //Automatically deals with size

        f.HOFetch(file_upload_endpoint,
            {
                method: 'POST',
                headers: {
                    // "Content-Type": "multipart/form-data"
                },
                body: formData
            },
            (fs_res) => {
                console.log(fs_res.message);
            }
        );
    }

    return (msg) => {

        // Seems it occasionally splices in an [object Object]
        // hence the discrepancy of about ~ 20 lines or so

        if (writestream === null) {
            //path = 'data/'+msg.bucket+'/'+msg.path;
            END = false;
            path = 'data/MAC000002.csv';
            console.log('Opening writestream for '+path);
            // Note: You will need to manually create the directories
            writestream = fs.createWriteStream(path);
            // Writing headers
            writestream.write(Object.values(msg.chunk).join(',') + "\n");
        }
        else {
            // HERE: Format msg.chunk back into csv from json
            COUNT ++;
            let chunk_as_csv_str = msg.chunk.reduce( (acc, row) => {
                if (row === null) { // Last chunk will have a null terminator
                    console.log('Detected null terminator');
                    END = true;
                    return acc;
                }
                return acc + Object.values(row).join(',') + "\n";
            })

            console.log (`Wrote chunk #${COUNT}.`);
            writestream.write(chunk_as_csv_str);

            if (END) {
                end_file_transfer();
            }
        }
    }
}


function build_live_data_handler(db_client, req, res) {
    return (msg) => {
        // On a 'live_data' message. Forward the data to the cloud database
        // by running a query.
        const query_text = msg.query.toString();
        db_client.query(query_text).then(
            x => {
                console.log('Query applied to cloud postgres successfully!');
            }
        )
        .catch(
            err => {
                console.log('Query failed on cloud postgres: '+err);
            }
        )
    }
}

export default {build_file_upload_handler, build_live_data_handler}