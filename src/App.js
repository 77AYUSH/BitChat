// import logo from "./logo.svg";
import "./App.css";
import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
// import Box from "@material-ui/core/Box";.
// import EmojiPicker from 'react-emoji-picker';
// import 'react-emoji-picker/dist/index.css';

import Divider from "@material-ui/core/Divider";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Avatar from "@material-ui/core/Avatar";
import Fab from "@material-ui/core/Fab";
import SendIcon from "@material-ui/icons/Send";
// import * as PushAPI from "@pushprotocol/restapi";
import {PushAPI} from "@pushprotocol/restapi";
import { ethers } from "ethers";
import { createSocketConnection, EVENTS } from '@pushprotocol/socket';
import { ChatUIProvider } from "@pushprotocol/uiweb";
import { ChatViewBubble } from "@pushprotocol/uiweb";
import { Button } from "@material-ui/core";

const useStyles = makeStyles({
  table: {},
  chatSection: {
    width: "100%",
    height: "90vh",
    background: "linear-gradient(45deg, #d3e0d2, #9ea180)",
    boxShadow: "0 1px 2px 0 rgb(145 158 171 / 24%)",
    borderRight: "1px solid #e0e0e0",
    borderLeft: "1px solid #e0e0e0",
    borderBottom: "1px solid #e0e0e0",
    borderRadius: "16px",
  },
  headBG: {
    backgroundColor: "#e0e0e0",
  },
  borderRight500: {
    borderRight: "1px solid #e0e0e0",
  },
  messageArea: {
    height: "60vh",
    overflowY: "auto",
  },
  senderMsgBox: {
    borderRadius: "0px 15px 15px 20px",
    background: "#eee",
    padding: "10px",
  },
  recieveMsgBox: {
    borderRadius: "20px 15px 0 15px",
    background: "aliceblue",
    padding: "10px",
  },
});
let user;
export default function App({component}) {
  const classes = useStyles();
  const [address, setAddress] = useState("");
  const [receiver, setReceiver] = useState("");
  const [message, setMessage] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectUser, setSelectUser] = useState(null);
  const [userChatMessages, setUserChatMessages] = useState([]);
  const shortAddress = (addr) =>
    addr.length > 10 && addr.startsWith("0x")
      ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
      : addr;
 
  const connectWallet = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    // MetaMask requires requesting permission to connect users accounts
    await provider.send("eth_requestAccounts", []);
    setProvider(provider);
    const signer = provider.getSigner();
    // console.log(signer, "signer");
    setSigner(signer);
    const address = await signer.getAddress();
    // console.log(address, "address");
    user = await PushAPI.initialize(signer, { env: 'staging' })
    setAddress(address);
    fetchChats(address);

    
    
    
  };

  const pushSDKSocket = createSocketConnection({
    user: address,
    socketType: 'chat',
    socketOptions: { autoConnect: true, reconnectionAttempts: 3 },
    env: 'staging',
  });
  pushSDKSocket.on(EVENTS.CONNECT, async (messages) => {
    // console.log('Socket Connected');
    // console.log(messages);
  });
  
  // React to message payload getting recieved
  pushSDKSocket.on(EVENTS.CHAT_RECEIVED_MESSAGE, async (messages) => {

    try{

    const newMessage =  await user.chat.latest(receiver);
    console.log(newMessage);
    setUserChatMessages([...userChatMessages, newMessage[0]]);
    pushSDKSocket.disconnect();

    }
    catch (error) {
          // Handle any exceptions, such as network errors, here
         
      }

  });
  
  
  pushSDKSocket.on(EVENTS.DISCONNECT, async (messages) => {
    // console.log('Socket Disconnected');

  });
  
  const sendMessage = async () => {
    // user = await PushAPI.initialize(signer, { env: 'staging' })
    const response = await user.chat.send(receiver,
      {
      type: 'Text',
      content: message,   
    }
    );
    // const data = await response.json();
    // console.log("Message sent is "+data);
    
    setMessage(" ");
    

  }

  const fetchChats = async () => {
    
    const userRequests = await user.chat.list("REQUESTS");
    if(userRequests.length > 0){
      userRequests.map(async(request) => {
        await approveChat(request);
      });
    }
    const userChats = await user.chat.list("CHATS");
    setUsers(userChats);

  }

  async function approveChat( request) {
    const acceptRequest = await user.chat.accept(request.intent);

  }

 

  const getHistory = async(receiverAdd) => {
    var chatHistory = await user.chat.history(receiverAdd);
  
    chatHistory = chatHistory.sort(function(x,y){
      return x.timestamp - y.timestamp;
    });
    // console.log(chatHistory);
    setUserChatMessages(chatHistory);
  }


  const selectedUser = async (user) => {
    setSelectUser(user?.wallets);
    await getHistory(user?.wallets);
    setReceiver(user?.wallets);

  }

  return (
    <div className="App">
      
    
      <Grid container>
        <Grid item xs={12} className="App-header">
          <Typography variant="h5" className="header-message">
            Bit Chat
          </Typography>
          <Button variant="conained" onClick={connectWallet} className="button">
            Connect Wallet
          </Button>
        </Grid>
      </Grid>
      <Grid container component={Paper} className="chatSection">
        <Grid item xs={3} className="borderRight500">
          <List>
            <ListItem button key="RemySharp">
              <ListItemIcon>
                <Avatar sx={{ bgcolor: "orange" }}>M</Avatar>
              </ListItemIcon>
              <ListItemText
                primary={shortAddress(
                  address
                    ? address
                    : "0x229528C1caBFe382CC2D93035029cBdAC95c8f86"
                )}
                style={{
                  color:"black",
                  padding: "3px 15px",
                  fontWeight: "bolder",
                }}
              ></ListItemText>
            </ListItem>
          </List>
          <Divider />
          <Grid item xs={12} style={{ padding: "10px" }}>
            <TextField
              id="outlined-basic-email"
              label="Search"
              variant="outlined"
              fullWidth
            />
          </Grid>
          
          <Divider />
          <List>
            {users &&
              users.map((usr, i) => {
                return (
                  <ListItem button key={i} onClick={() => selectedUser(usr)}>
                    <ListItemIcon>
                      <Avatar alt={usr?.name} src={usr?.profilePicture} />
                    </ListItemIcon>
                    <ListItemText
                      primary={shortAddress(
                        usr?.wallets?.replace("eip155:", "")
                      )}
                      style={{
                        padding: "3px 15px",
                        fontWeight: "bolder",
                      }}
                    >
                      {shortAddress(usr?.wallets?.replace("eip155:", ""))}
                    </ListItemText>
                    {/* <ListItemText secondary="online" align="right"></ListItemText> */}
                  </ListItem>
                );
              })}
          </List>
        </Grid>
      
        <ChatBox
          classes={classes}
          receiver={receiver}
          setReceiver={setReceiver}
          message={message}
          setMessage={setMessage}
          userChatMessages={userChatMessages}
          sendMessage = {sendMessage}
   
          address={address}
        />
  
      </Grid>
    </div>
  );
}



const ChatBox = ({
  classes,
  receiver,
  setReceiver,
  message,
  setMessage,
  userChatMessages,
  sendMessage,
 
  address,
}) => {
  return (
    <Grid item xs={9}>
      <List className="messageArea">
        {userChatMessages &&
          userChatMessages.map((data, i) => {
            return (
              <ListItem key={i}>
                <Grid
                  container
                  style={{
                    display: "grid",
                    justifyContent:
                      data?.fromDID == `eip155:${address}` ? "right" : "left",
                  }}
                className="message-box">
                  <div>
                  <ChatViewBubble chat={data} />
                  </div>
                  {/* <Grid item xs={12}> */}
                    {/* <ListItemText
                      align="right"
                      style={{
                        textAlign:
                          data?.fromDID == `eip155:${address}`
                            ? "right"
                            : "left",
                      }}
                      primary={data?.messageContent}
                    ></ListItemText> */}
                  {/* </Grid> */}
                  {/* <Grid item xs={12}>
                    <ListItemText
                      align="right"
                      secondary={new Date(data?.timestamp).toLocaleString()}
                    ></ListItemText>
                  </Grid> */}
                </Grid>
              </ListItem>
            );
          })}
      </List>
      <Divider />
      <Grid container>
        <Grid item xs={4} style={{margin:"10px"}}>
          <TextField hidden="true"
            id="outlined-basic-email"
            label="Receiver Address"
            fullWidth
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
          />
        </Grid>
        <Grid item xs={5} style={{margin:"10px"}}>
          <TextField
            id="outlined-basic-email"
            label="Message.."
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </Grid>
        <Grid xs={2} align="right" style={{margin:"10px"}}>
          <Fab color="primary" aria-label="add" onClick={() => {sendMessage()}}>
            <SendIcon />
          </Fab>
        </Grid>
      </Grid>
    </Grid>
  );
};
