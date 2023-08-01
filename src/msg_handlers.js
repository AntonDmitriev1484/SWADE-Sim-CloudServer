import fs from "fs"
import  * as f from "./fetch_methods.js"
import FormData from "form-data"


function build_file_upload_handler(file_upload_endpoint, req, res) {
    let writestream = null;
    let path = null;

    return (msg) => {

        if (writestream === null) {
            console.log('Opening writestream for '+path);
            //path = 'data/'+msg.bucket+'/'+msg.path;
            path = 'data/MAC000002.csv';
            // Note: You will need to manually create the directories
            writestream = fs.createWriteStream(path);
        }

        if (msg.chunk === null) {
            console.log('Closing writestream');

            writestream.end();
            writestream = null;
            const file = fs.createReadStream(path);
            path = null;

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
        else {
            // HERE: Format msg.chunk back into csv from json
            let chunk_as_csv_str = Object.values(msg.chunk).join(',') + "\n";
            writestream.write(chunk_as_csv_str);
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