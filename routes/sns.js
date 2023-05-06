var express = require('express');
const router = express.Router();

router.post('/', async function (req, res) {
    let info = req.body;
    const { DynamoDBClient, PutItemCommand, GetItemCommand } = require("@aws-sdk/client-dynamodb");
    const dynamoClient = new DynamoDBClient({ region: "us-east-1"});
    let codigo = Math.floor(100000 + Math.random() * 900000);
      const params = {
              TableName: "Users",
              Key: {
                email: { S: info.email }
              }
      };
  
      // create GetItemCommand with the parameters
      const command = new GetItemCommand(params);
            // send the GetItemCommand to DynamoDB
            try {
              const response = await dynamoClient.send(command);
              console.log(response);
              if(response.Item){
                response.Item.password.S == info.password;
                console.log("Usuario correcto, mandando codigo");
                let str = "Bievenido, su codigo es: " + codigo;
                snspost(str);
                res.send({ resp: codigo});
              }else{
                console.log("Usuario incorrecto");
                res.send({ error: "Usuario o contraseña Incorrectos"});
              }
              
            } catch (err) {
              console.error(err);
            }

});

async function snspost(message){
    const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
    const snsClient = new SNSClient({region: "us-east-1"});
    var params = {
        Message: message, // MESSAGE_TEXT
        TopicArn: "arn:aws:sns:us-east-1:598045795517:Chatroom", //TOPIC_ARN
    };

    try {
        const data = await snsClient.send(new PublishCommand(params));
        console.log("Success.",  data);
        return data; // For unit tests.
      } catch (err) {
        console.log("Error", err.stack);
      }
};

module.exports = router;