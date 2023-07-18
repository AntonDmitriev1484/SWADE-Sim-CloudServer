import express from "express"
import moment from "moment"
import fetch from "node-fetch"

const app = express();
app.use(express.json());

// Data for testing put requests
const data = ["1", "2", "buckle my shoe", "3", "4", "buckle some more"]

function test_get() {
    const endpoint = "http://s3:9000/test/Anime.txt"
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
        console.log('GET request successful');
        console.log(result);
      })
    .catch(error => {
        console.error('Error:', error);
      });
}


// The API is receiving this requests, at the correct endpoint, just not really
// doing anything with them at the moment.
// Figure out how I would set up a table with this.
function test_put() {
    const endpoint = "http://s3:9000/test/Anime.txt"
    data.map(
        (x) => {
            fetch(endpoint, {
                method: 'PUT',
                headers: {
                    'Host':'s3:9000',
                    'x-amz-date': moment().toISOString(),
                    'Authorization':'AKIAIOSFODNN7EXAMPLE',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(x)
            })
            .then(response => {response.json()})
            .then(result => {
                console.log('POST request successful');
                console.log(result);
              })
            .catch(error => {
                console.error('Error:', error);
              });
        }
    )
}


app.post('/', (req, res)=> {
    console.log("Received POST request:")
    console.log(req.body);
    console.log("----------------------")
    res.send("Recieved POST request!");
})

app.listen(3000, () => {
    test_put();
})