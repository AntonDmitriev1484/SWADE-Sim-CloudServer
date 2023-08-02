import fs from "fs"
import  * as f from "./fetch_methods.js"
import FormData from "form-data"


function build_file_upload_handler(file_upload_endpoint, req, res) {
    let writestream = null;
    let dir_path = null; // Path right up to the file
    let full_path = null; // Path including the filename
    let END = false;
    let COUNT = 0;

    return (msg) => {
        
        if (writestream === null) {
            // Want this to be synchronous for now
            // Really don't want to convert this to functional
            dir_path = `tempdata/${msg.bucket}/${msg.path}`;
            full_path = dir_path + '/' + msg.filename;

            // Create a directory within tempdata to hold this temporary file
            fs.mkdirSync(dir_path, { recursive: true }, (err) => {
                if (err) {
                  console.error('Error creating directory:', err);
                } else {
                  console.log('Directory created successfully!');
                }
            });
            END = false;
            console.log('Opening writestream for '+full_path);
            writestream = fs.createWriteStream(full_path);
            // Writing headers
            writestream.write(Object.values(msg.chunk).join(',') + "\n");
        }
        else {
            COUNT ++;
            // Convert chunk from an array of jsons to a string in csv format
            let chunk_as_csv_str = msg.chunk.reduce( (acc, row) => {
                if (row === null) { // Last chunk will have a null terminator
                    console.log('Detected null terminator');
                    END = true;
                    return acc;
                }
                return acc + Object.values(row).join(',') + "\n";
            }, "");

            console.log (`Wrote chunk #${COUNT}.`);
            writestream.write(chunk_as_csv_str);

            if (END) {
                end_file_transfer();
            }
        }


        function end_file_transfer() {
            console.log('Closing writestream');
    
            writestream.end();
            writestream = null;
            const file = fs.createReadStream(full_path);
            dir_path = null;
            full_path = null;
    
            console.log(' Cloud read: '+COUNT+' chunks. ');
            COUNT = 0;
    
            const formData = new FormData();
            formData.append('bucket', msg.bucket);
            formData.append('path', msg.path);
            formData.append('filename', msg.filename);
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
                    // Delete temporary directory that we wrote this file to
                    fs.rmSync(`tempdata/${msg.bucket}`, { recursive: true, force: true });
                }
            );
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