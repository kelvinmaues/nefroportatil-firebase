const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database. 
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
// [END import]
const sodioDailyLimit = 4;
const fosforoDailyLimit = 800;
const potassioDailyLimit = 1000;
// [START makeUppercase]
// Listens for new messages added to /messages/:pushId/original and creates an
// uppercase version of the message to /messages/:pushId/uppercase
// [START makeUppercaseTrigger]
exports.makeUppercase = functions.database.ref('/messages/{pushId}/original')
    .onWrite(event => {
// [END makeUppercaseTrigger]
      // [START makeUppercaseBody]
      // Grab the current value of what was written to the Realtime Database.
      const original = event.data.val();
      console.log('Uppercasing', event.params.pushId, original);
      const uppercase = original.toUpperCase();
      // You must return a Promise when performing asynchronous tasks inside a Functions such as
      // writing to the Firebase Realtime Database.
      // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
      return event.data.ref.parent.child('uppercase').set(uppercase);
      // [END makeUppercaseBody]
    });
// [END makeUppercase]
// [END all]

  const limitsDailyProportion = (fosforo, potassio, sodio) => {

    const fosforoPercentual = fosforo/fosforoDailyLimit
    const potassioPercentual = potassio/potassioDailyLimit
    const sodioPercentual = sodio/sodioDailyLimit

    const percentualAtingido = {
      fosforo: fosforoPercentual,
      potassio: potassioPercentual,
      sodio: sodioPercentual
    };

    return percentualAtingido;
  }

// [START calculoLimitesDiarios]
// Listens for new user insertions added to /users/{userId}/consumo_alimentar/{date} and calculate
// daily limits and write the new data to /users/{userId}/limites_diarios/{date}
exports.calculoLimitesDiarios = functions.database.ref('/users/{userId}/consumo_alimentar/{date}')
	.onWrite(event => {
    var fosforoTotalDiario = 0;
    var potassioTotalDiario = 0;
    var sodioTotalDiario = 0;
		console.log('User Params ID', event.params.userId)
    console.log('Event Params Date', event.params.date)
    console.log('Data', event.data)
    const json = event.data.val();
    //const arrJSON = [];
    for (var obj in json){
      fosforoTotalDiario += json[obj].nutrientes_consumidos.fosforoTotal
      potassioTotalDiario += json[obj].nutrientes_consumidos.potassioTotal
      sodioTotalDiario += json[obj].nutrientes_consumidos.sodioTotal
      //arrJSON.push(json[obj]);
    }
    //console.log('arrJSON', arrJSON)
    const percentualAtingido = limitsDailyProportion(fosforoTotalDiario, potassioTotalDiario, sodioTotalDiario);
    const limite_nutricional = {
      fosforo: fosforoTotalDiario, 
      potassio: potassioTotalDiario, 
      sodio: sodioTotalDiario
    }

    console.log('Nutrientes Totais => ', fosforoTotalDiario, potassioTotalDiario, sodioTotalDiario)
    console.log('Percentual dos Nutrientes Diários =>', percentualAtingido.fosforo, percentualAtingido.potassio, percentualAtingido.sodio)
    
    const limites_diarios = {
      limite_percentual: percentualAtingido,
      limite_nutricional: limite_nutricional
    };

    //const newPostKey = functions.database().ref('users/' + event.params.userId).child('limites_diarios').push();

    const updates = {};

    return event.data.ref('users/' + event.params.userId).parent.child('/limites_diarios/' + event.params.date + '/').set(limites_diarios);


	});
// [END makeUppercase]
// [END all]