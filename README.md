# ralf-ce-broker




## Usefull commands
### Run Broker
You can run the broker in a couple of ways:
* `docker-compose up broker` **prefered**
* `npm run bin`  
* `node bin/broker.js`  

This will expose a tcp server, available at: `rallf-ce-broker:3000`


### Run Rabbit (test)
Launches a RabbitMQ instance.

* `docker-compose up rabbit`
* 
Available at: `http://localhost:9001`


### Run Crossbar - ws (test)
Launches a Crossbar.io router and wamp server.

`docker-compose up crossbar-server`

Available at: `ws://127.0.0.1:9000/ws`


## Notes
>  For routing take a look at https://www.rabbitmq.com/tutorials/tutorial-four-javascript.html

Require messages to be in JSON-rpc
Create tcp server, so that other programs can interact with broker
  - Should it be a server or client?

3 queues per process (in, out, error)
Router identifier, an id to identity this queue

Each queue reader must be able to either write to any queue or send a tcp command
Each queue writer must be able to write to any queue  

It receives data from process.env
* API_WS_URL   - string
* API_WS_AUTH  - string
* RABBIT_URL   - string
* INCUBATOR_ID - string
* TASKS        - "{ x: {}}"

Queue reader, reads from specified queue and performs some action.
It will restart whenever a new task needs a queue.
