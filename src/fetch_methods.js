import fetch from "node-fetch"
import moment from "moment"

export function make_S3_header() {
    return {
        'Host':'s3:9000',
        'x-amz-date': moment().toISOString(),
        'Authorization':'AKIAIOSFODNN7EXAMPLE',
        'Content-Type': 'application/json'
    }
}

export function HOFetch(endpoint, json, on_success ){
    fetch(endpoint, json)
    .then(res=>res.json())
    .then((response)=>{
        on_success(response)
    })
    .catch((error)=>console.error("Error",error));
}

export function test_get() {
    const endpoint = "http://s3:9000/test/Anime.txt"
    HOFetch(
    endpoint,
    {
        method: 'GET',
        headers: make_S3_header()
    },
    (res) => {
        console.log('GET request successful');
        console.log(result);
    } 
    );
}


// The API is receiving this requests, at the correct endpoint, just not really
// doing anything with them at the moment.
// Figure out how I would set up a table with this.
export function test_put() {
    // Data for testing put requests
    const data = ["1", "2", "buckle my shoe", "3", "4", "buckle some more"]
    const endpoint = "http://s3:9000/test/Anime.txt"
    data.map(
        (x) => {
            HOFetch(
            endpoint, 
            {
                method: 'PUT',
                headers: make_S3_header(),
                body: JSON.stringify(x)
            },
            (res) => {
                console.log('POST request successful');
                console.log(result);
            });
        }
    )
}






