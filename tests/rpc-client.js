const jayson = require('jayson');

// create a client
const client = jayson.client.http({
  port: 3000
});

client.request('dispatch', { to: 'test-task', body: { test: 'jekjhrekjhr' } }, function (err, response) {
  if (err) {
    console.log('err', err);
    throw err;
  }

  if (response.error) {
    console.log('response.error', response.error);
    throw response.error;
  }

  let res = response.result;
  console.log(res);
});

// client.request('move', { from: 'Pascual', to: 'Ximo' }, function (err, response) {
//     if (err) {
//       console.log('err', err);
//       throw err;
//     }

//     if (response.error) {
//       console.log('response.error', response.error);
//       throw response.error;
//     }

//     let res = response.result;
//     console.log(res);
//   });