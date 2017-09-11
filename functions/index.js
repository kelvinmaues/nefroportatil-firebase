const functions = require('firebase-functions');
var Expo = require('expo-server-sdk');
// Create a new Expo SDK client
var expo = new Expo();

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
// [END import]
const sodioDailyLimit = 4;
const fosforoDailyLimit = 800;
const potassioDailyLimit = 1000;
const hidricoDailyLimit = 500;

// Function to calculate percentual of nutrients
const percentualNutricional = (fosforo, potassio, sodio) => {
  const fosforoPercentual = fosforo/fosforoDailyLimit
  const potassioPercentual = potassio/potassioDailyLimit
  const sodioPercentual = sodio/sodioDailyLimit

  const percentualAtingido = {
    fosforo: fosforoPercentual.toPrecision(2),
    potassio: potassioPercentual.toPrecision(2),
    sodio: sodioPercentual.toPrecision(2)
  };

  return percentualAtingido;
}

// Function to calculate percentual hidric
const percentualHidrico = (hidrico) => {

  const percentualHidricoAtingido = hidrico/hidricoDailyLimit;

  return percentualHidricoAtingido.toPrecision(2);

}

// [START calculoLimitesDiarios]
// Listens for new user insertions added to /users/{userId}/consumo_alimentar/{date} and calculate
// daily limits and write the new data to /users/{userId}/limites_diarios/{date}
exports.calculoLimitesDiarios = functions.database.ref('/users/{userId}/consumo_alimentar/{date}')
	.onWrite(event => {
    // Inicialização dos valores dos nutrientes para cálculo
    var fosforoTotalDiario = 0;
    var potassioTotalDiario = 0;
    var sodioTotalDiario = 0;
    var hidricoTotalDiario = 0;
    var messages = [];

    // Obtem o Expo token do usuário
    const userUid = event.params.userId;

		console.log('Usuário ID', event.params.userId)
    console.log('Event Params Date', event.params.date)
    console.log('Data', event.data)

    const json = event.data.val();
    //const arrJSON = [];
    for (var obj in json){
      fosforoTotalDiario += json[obj].nutrientes_consumidos.fosforoTotal
      potassioTotalDiario += json[obj].nutrientes_consumidos.potassioTotal
      sodioTotalDiario += (json[obj].nutrientes_consumidos.sodioTotal)/1000.0
      hidricoTotalDiario += json[obj].volume_hidrico_consumido
      //arrJSON.push(json[obj]);
    }
    //console.log('arrJSON', arrJSON)
    const percentualNutricionalAtingido = percentualNutricional(fosforoTotalDiario, potassioTotalDiario, sodioTotalDiario);
    const volumePercentualAtingido = percentualHidrico(hidricoTotalDiario);

    const limite_nutricional = {
      fosforo: fosforoTotalDiario.toFixed(),
      potassio: potassioTotalDiario.toFixed(),
      sodio: sodioTotalDiario.toFixed(1)
    }

    console.log('Nutrientes Totais => ', fosforoTotalDiario, potassioTotalDiario, sodioTotalDiario)
    console.log('Percentual dos Nutrientes Diários =>', percentualNutricionalAtingido.fosforo, percentualNutricionalAtingido.potassio, percentualNutricionalAtingido.sodio)
    console.log('Volume Hídrico Diário =>', volumePercentualAtingido + ' %', hidricoTotalDiario + ' ml')

    const limites_diarios = {
      limite_percentual_atingido: percentualNutricionalAtingido,
      limite_nutricional_atingido: limite_nutricional,
      limite_percentual_hidrico:  volumePercentualAtingido,
      limite_volume_hidrico: hidricoTotalDiario
    };

    console.log(limites_diarios);

    return admin.database().ref('/users/' + event.params.userId + '/limites_diarios/' + event.params.date + '/').set(limites_diarios);
});
// [END makeUppercase]
// [END all]
