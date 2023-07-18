import express from "express"
import moment from "moment"
import fetch from "node-fetch"

const app = express();
app.use(express.json());

const data = ["1", "2", "buckle my shoe", "3", "4", "buckle some more"]
const endpoint = "http://s3:9000/test/Anime.txt"

//Run S3 API-Calls against http://localhost:9444/ (e.g. http://localhost:9444/test-bucket/test-object)
//http://localhost:9444/ui

fetch(endpoint, {
    method: 'GET',
    headers: {
        'Host':'s3:9000',
        'x-amz-date': moment().toISOString(),
        'Authorization':'AKIAIOSFODNN7EXAMPLE',
        'Content-Type': 'application/json'
    }
})
.then(response => {
    console.log(response.json())
    return response.json()
})
.then(result => {
    console.log('POST request successful');
    console.log(result);
  })
.catch(error => {
    console.error('Error:', error);
  });



//   method: 'GET',
//     headers: {
//         'Authorization':'AKIAIOSFODNN7EXAMPLE',
//         'Content-Type': 'application/json'
//     }

// data.map(
//     (x) => {
//         fetch(endpoint, {
//             method: 'PUT',
//             headers: {
//                 'aws_access_key_id':'AKIAIOSFODNN7EXAMPLE',
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(x)
//         })
//         .then(response => {
//             console.log(response.json())
//             return response.json()
//         })
//         .then(result => {
//             console.log('POST request successful');
//             console.log(result);
//           })
//         .catch(error => {
//             console.error('Error:', error);
//           });
//     }
// )

app.post('/', (req, res)=> {
    console.log("Received POST request:")
    console.log(req.body);
    console.log("----------------------")
    res.send("Recieved POST request!");
})

app.listen(3000, () => {
    console.log("Listening for requests on 3000");
})