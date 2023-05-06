var express = require('express');
const router = express.Router();

const { DynamoDBClient, PutItemCommand, GetItemCommand, DeleteItemCommand, UpdateItemCommand   } = require("@aws-sdk/client-dynamodb");
const { LexRuntimeServiceClient, PostTextCommand } = require("@aws-sdk/client-lex-runtime-service")




const dynamoClient = new DynamoDBClient({ region: "us-east-1"})
const lexClient = new LexRuntimeServiceClient({ region: "us-east-1"})

router.post('/', async function (req, res) {
    console.log("Answer recived");
    const input = { // PostContentRequest
      botName: "InventarioBot", // required
      botAlias: "inventabot", // required
      userId: req.session.id, // required
      contentType: "text/plain; charset=utf-8", // required
      inputText: req.body.text, // required
    };
    const command = new PostTextCommand(input);
    try {
      const response = await lexClient.send(command);
      console.log(response);

      if(response.intentName == "VerProducto"){
        if (response.dialogState == "ReadyForFulfillment"){
          const params = {
            TableName: "Inventario",
            Key: {
              ID: { S: response.slots.ID }
            }
          };
          // create GetItemCommand with the parameters
          const command = new GetItemCommand(params);
          // send the GetItemCommand to DynamoDB
          try {
            const response = await dynamoClient.send(command);
            console.log(response);
            if(response.Item){
              res.send({ resp: "ID del producto: </br> ID: "+ response.Item.ID.S + "</br> Nombre: "+ response.Item.Nombre.S + "</br> Piezas: "+ response.Item.Piezas.S + "</br> Ficha Técnica: "+ response.Item.Ficha.S}) 
            }else{
              res.send({ resp: "No se encontro el producto"});
            }
            
          } catch (err) {
            console.error(err);
          }
        }else{
        res.send({ resp: response.message})
        console.log(response);  
        }

        
      }else if (response.intentName == "BorrarProducto"){
        if (response.dialogState == "ReadyForFulfillment"){
            // Set the inputs
            const params = {
              TableName: "Inventario",
              Key: {
                ID: { S: response.slots.ID }
              }
            };

            // Create the PutItem command
            const command = new DeleteItemCommand(params);

            // Execute the command
            try {
              const result = await dynamoClient.send(command);
              res.send({ resp: "Producto eliminado"}) 
            } catch (err) {
              res.send({ resp: "ERROR, no pudimos borrar el producto"}) 
            }

        }else{
          res.send({ resp:response.message})
          console.log(response);        
        }
    }else if (response.intentName == "ActualizarInventario"){
      if (response.dialogState == "ReadyForFulfillment"){
          // Set the inputs
          const params = {
            TableName: "Inventario",
              Key: {
                ID: { S: response.slots.ID }
              },
              ExpressionAttributeNames: {
                "#Y": "Piezas"
               }, 
               ExpressionAttributeValues: {
                ":y": {
                  "S": response.slots.Pieza
                 }
               }, 
               UpdateExpression: "SET #Y = :y"
          };

          // Create the PutItem command
          const command = new UpdateItemCommand(params);

          // Execute the command
          try {
            const result = await dynamoClient.send(command);
            res.send({ resp: "El inventario ha sido actualizado correctamente"}) 
          } catch (err) {
            res.send({ resp: "ERROR, no pudimos actualizar el inventario" + err}) 
          }

      }else{
        res.send({ resp:response.message})
        console.log(response);        
      }
  }else if (response.intentName == "AltaInventario"){
    if (response.dialogState == "ReadyForFulfillment"){
        // Set the inputs
        const params = {
          TableName: "Inventario",
          Item: {
            "ID": { "S":  response.slots.ID},
            "Nombre": { "S": response.slots.Nombre },
            "Piezas": { "S": response.slots.Pieza },
            "Ficha": { "S": response.slots.Ficha },
          },
        };

        // Create the PutItem command
        const command = new PutItemCommand(params);

        // Execute the command
        try {
          const result = await dynamoClient.send(command);
          res.send({ resp: "Producto agregado satisfactoriamente"}) 
        } catch (err) {
          res.send({ resp: "ERROR, no pudimos agregar tu producto"}) 
        }

    }else{
      res.send({ resp:response.message})
      console.log(response);        
    }
}
  } catch (error) {
      res.send({ resp:error})
      console.log(error);
    }

});

module.exports = router;


