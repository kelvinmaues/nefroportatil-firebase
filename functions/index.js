const functions = require('firebase-functions');
var Expo = require('expo-server-sdk');
// Create a new Expo SDK client
var expo = new Expo();

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
// [END import]
const limiteSodioDiarioPadrao = 4;
const limiteFosforoDiarioPadrao = 800;
const limitePotassioDiarioPadrao = 2000;

// [START percentualNutricional Function]
const percentualNutricional = (fosforo, potassio, sodio) => {
  const fosforoPercentual = fosforo/limiteFosforoDiarioPadrao
  const potassioPercentual = potassio/limitePotassioDiarioPadrao
  const sodioPercentual = sodio/limiteSodioDiarioPadrao

  const percentualAtingido = {
    fosforo: fosforoPercentual.toPrecision(2),
    potassio: potassioPercentual.toPrecision(2),
    sodio: sodioPercentual.toPrecision(2)
  };
  return percentualAtingido;
}

//------- [START percentualHidrico Function]---------
const percentualHidrico = (hidrico, limiteHidrico = 500) => {
  var percentualHidricoAtingido = hidrico/limiteHidrico;
  percentualHidricoAtingido = percentualHidricoAtingido.toPrecision(2)

  return percentualHidricoAtingido;
}
// [END percentualHidrico Function]

//------ [START calculoLimitesDiarios]---------------
// Listens for new user insertions added to /users/{userId}/consumo_alimentar/{date} and calculate
// daily limits and write the new data to /users/{userId}/limites_diarios/{date}
exports.calculoLimitesDiarios = functions.database.ref('/users/{userId}/consumo_alimentar/{date}')
	.onWrite(event => {
    // Inicialização dos valores dos nutrientes para cálculo
    var fosforoTotalDiario = 0;
    var potassioTotalDiario = 0;
    var sodioTotalDiario = 0;
    var hidricoTotalDiario = 0;
    // Obtem o ID Firebase do usuário
    const userUid = event.params.userId;

    return (
      admin.database().ref(`/users/${userUid}/controle_hidrico/limite_hidrico_diario_total`).once('value').then(function(snapshot){

      const limiteHidricoDiarioMaximo = snapshot.val();

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
      const volumePercentualAtingido = percentualHidrico(hidricoTotalDiario, limiteHidricoDiarioMaximo);

      const limite_nutricional = {
        fosforo: fosforoTotalDiario.toFixed(),
        potassio: potassioTotalDiario.toFixed(),
        sodio: sodioTotalDiario.toFixed(1)
      }

      console.log('Nutrientes Totais => ', fosforoTotalDiario, potassioTotalDiario, sodioTotalDiario)
      console.log('Percentual dos Nutrientes Diários =>', percentualNutricionalAtingido.fosforo, percentualNutricionalAtingido.potassio, percentualNutricionalAtingido.sodio)
      console.log('Volume Hídrico Diário =>', volumePercentualAtingido + '%', hidricoTotalDiario + ' ml')

      const limites_diarios = {
        limite_nutricional: {
          limite_percentual_atingido: percentualNutricionalAtingido,
          limite_nutricional_atingido: limite_nutricional,
          limite_percentual_hidrico:  volumePercentualAtingido,
          limite_volume_hidrico: hidricoTotalDiario
        },
        limite_percentual_hidrico:  volumePercentualAtingido,
        limite_volume_hidrico: hidricoTotalDiario
      };

      admin.database().ref(`/users/${event.params.userId}/limites_diarios/${event.params.date}/`).set(limites_diarios);
    })
  )
});

// [END calculoLimitesDiarios]

// [START calculoLimiteHidricoDiarioTotal]
// Listens for new messages added to /messages/:pushId/original and creates an
// uppercase version of the message to /messages/:pushId/uppercase
exports.calculoLimiteHidricoDiarioTotal = functions.database.ref('/users/{userId}/controle_hidrico')
    .onWrite(event => {
      // Grab the current value of what was written to the Realtime Database.
      const volumeUrinario = event.data.val();
      console.log('Volume Urinario', volumeUrinario.volume_urinario_fornecido);

      const limiteHidrico = 500 + volumeUrinario.volume_urinario_fornecido;

      console.log('Volume Urinário', limiteHidrico);

      //return admin.database().ref('/users/' + event.params.userId + '/limite_hidrico_diario/').set(limiteHidrico);
      return event.data.ref.child('limite_hidrico_diario_total').set(limiteHidrico);
    });
// [END calculoLimiteHidricoDiarioTotal]
// [END all]
