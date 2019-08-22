This is a POC to demonstrate the possibilty of using webrtc data transfer to reduce fanout at edge layer.

The requirement is to replicate a real-time updated list across clients. To achieve this, a network of peer is formed in client side, for each message, there are 2 phases of transmission: first phase is gossiping attempt (send the message to a small portion of the peer nodes and let them to propagate to the rest), second phase is direct server send for clients that didn't receive message in time. Implementation details of this broadcast strategy are in `server/src/sender.js` & `client/src/App.js`.


![Visualization](https://user-images.githubusercontent.com/24643783/63252676-ceb57600-c2a2-11e9-852e-301f1ab94b2b.gif)

There are 3 components: a client, a server and a visualization dashboard.

From `sendo/`
```
cd server && yarn && yarn start
cd client && yarn && yarn start
cd dashboard && yarn && yarn start
```

Open a few clients at `localhost:3000`

Open visualization dashboard at `localhost:3333`
