import Buffer from 'buffer';
import { PollChoice } from '../../';
import crypto from 'crypto';
import {
  Address,
  Base16,
  Ed25519Signature,
  encodeBase16,
  getAddressFromWif,
  getWifFromPrivateKey,
  PBinaryReader,
  PBinaryWriter,
  PhantasmaKeys,
  ScriptBuilder,
  Serialization,
  stringToUint8Array,
  Timestamp,
  Transaction,
  uint8ArrayToHex,
  uint8ArrayToString,
  uint8ArrayToStringDefault,
  VMObject,
  VMType,
} from '../../core';

describe('test phantasma_ts', function () {
  test('test phantasma-ts.Transaction.SerializeData', function (done) {
    let writer = new PBinaryWriter();
    let keys = PhantasmaKeys.generate();

    let nexusName = 'nexus';
    let chainName = 'main';
    let script = 'script';
    let expiration = new Date(17898129498);
    let payload = 'payload';
    let signatures = [new Ed25519Signature()];
    writer.writeString(nexusName);
    let tx = new Transaction(nexusName, chainName, script, expiration, payload);
    tx.signWithKeys(keys);
    tx.SerializeData(writer);
    /*expect(writer.toUint8Array()).toBe([
      5, 110, 101, 120, 117, 115, 5, 110, 101, 120, 117, 115, 5, 109, 97, 105,
      110,
    ]);*/
    done();
  });

  test('sginature', function (done) {
    let writer = new PBinaryWriter();
    let keys = PhantasmaKeys.generate();

    let wifTest = 'L5UEVHBjujaR1721aZM5Zm5ayjDyamMZS9W35RE9Y9giRkdf3dVx';
    let keyFromWif = PhantasmaKeys.fromWIF(wifTest);

    expect(keyFromWif.toWIF()).toBe(wifTest);

    let nexusName = 'nexus';
    let chainName = 'main';
    let script = 'script';
    let expiration = new Date(17898129498);
    let payload = 'payload';
    let tx = new Transaction(nexusName, chainName, script, expiration, payload);

    let wif = keys.toWIF();
    let pk = uint8ArrayToHex(keys.PrivateKey);

    tx.sign(wif);

    tx.signWithPrivateKey(pk);

    /*let wif = getWifFromPrivateKey(
      uint8ArrayToString(Array.from(keys.PrivateKey) as Uint8Array)
    );
    let pk = uint8ArrayToString(Array.from(keys.PrivateKey));

    console.log(wif, getAddressFromWif(wif), pk);

    tx.sign(pk);
    tx.SerializeData(writer);*/
    done();
  });

  test('Test signature ts and c#', function (done) {
    let nexusName = 'testnet';
    let chainName = 'main';
    let wif = 'L5UEVHBjujaR1721aZM5Zm5ayjDyamMZS9W35RE9Y9giRkdf3dVx';
    let uintArray = Uint8Array.from([0x01, 0x02, 0x03]);
    let script = uint8ArrayToHex(uintArray);
    let time = new Timestamp(1234567890);
    let date = new Date(time.toString());
    let payload = 'payload';
    let keys = PhantasmaKeys.fromWIF(wif);
    let tx = new Transaction(nexusName, chainName, script, date, payload);

    tx.signWithKeys(keys);

    let fromCsharp =
      '07746573746E6574046D61696E03010203D2029649077061796C6F61640101404C033859A20A4FC2E469B3741FB05ACEDFEC24BFE92E07633680488665D79F916773FF40D0E81C4468E1C1487E6E1E6EEFDA5C5D7C53C15C4FB349C2349A1802';
    let fromCsharpBytes = Buffer.Buffer.from(fromCsharp, 'hex');
    let bytes = stringToUint8Array(fromCsharp);
    let fromCsharpTx = Transaction.Unserialize(fromCsharpBytes);

    expect(fromCsharpTx.chainName).toBe(tx.chainName);
    expect(fromCsharpTx.nexusName).toBe(tx.nexusName);
    expect(fromCsharpTx.script).toBe(tx.script);
    expect(fromCsharpTx.payload).toBe(Base16.encode(tx.payload));
    expect(fromCsharpTx.expiration).toStrictEqual(tx.expiration);
    expect(fromCsharpTx.signatures.length).toBe(tx.signatures.length);
    expect(fromCsharpTx.signatures[0].Kind).toBe(tx.signatures[0].Kind);
    expect(fromCsharpTx.signatures[0].ToByteArray()).toStrictEqual(tx.signatures[0].ToByteArray());

    done();
  });

  test('Transaction Serialized to bytes', function (done) {
    let nexusName = 'testnet';
    let chainName = 'main';
    let subject = 'system.nexus.protocol.version';
    let wif = 'L5UEVHBjujaR1721aZM5Zm5ayjDyamMZS9W35RE9Y9giRkdf3dVx';
    let mode = 1;
    let choice = new PollChoice('myChoice');
    let choice2 = new PollChoice('myChoice');
    let choices = [choice, choice2];
    let choicesSerialized = Serialization.Serialize(choices);
    let time = new Timestamp(1234567890);
    let date = new Date(time.toString());
    let startTime = time;
    let endTime = new Timestamp(time.value + 86400);
    let payload = Base16.encode('Consensus'); // hex string

    let keys = PhantasmaKeys.fromWIF(wif);
    let sb = new ScriptBuilder();

    let gasLimit = 10000;
    let gasPrice = 210000;

    let script = sb
      .AllowGas(keys.Address, Address.Null, gasLimit, gasPrice)
      .CallContract('consensus', 'SingleVote', [keys.Address.Text, subject, 0])
      .SpendGas(keys.Address)
      .EndScript();

    expect(script).toBe(
      '0D00030350340303000D000302102703000D000223220000000000000000000000000000000000000000000000000000000000000000000003000D000223220100AA53BE71FC41BC0889B694F4D6D03F7906A3D9A21705943CAF9632EEAFBB489503000D000408416C6C6F7747617303000D0004036761732D00012E010D0003010003000D00041D73797374656D2E6E657875732E70726F746F636F6C2E76657273696F6E03000D00042F50324B464579466576705166536157384734566A536D6857555A585234517247395951523148624D7054554370434C03000D00040A53696E676C65566F746503000D000409636F6E73656E7375732D00012E010D000223220100AA53BE71FC41BC0889B694F4D6D03F7906A3D9A21705943CAF9632EEAFBB489503000D0004085370656E6447617303000D0004036761732D00012E010B'
    );

    let tx = new Transaction(nexusName, chainName, script, date, payload);

    tx.signWithKeys(keys);

    expect(uint8ArrayToHex(tx.ToByteAray(true)).toUpperCase()).toBe(
      '07746573746E6574046D61696EFD42010D00030350340303000D000302102703000D000223220000000000000000000000000000000000000000000000000000000000000000000003000D000223220100AA53BE71FC41BC0889B694F4D6D03F7906A3D9A21705943CAF9632EEAFBB489503000D000408416C6C6F7747617303000D0004036761732D00012E010D0003010003000D00041D73797374656D2E6E657875732E70726F746F636F6C2E76657273696F6E03000D00042F50324B464579466576705166536157384734566A536D6857555A585234517247395951523148624D7054554370434C03000D00040A53696E676C65566F746503000D000409636F6E73656E7375732D00012E010D000223220100AA53BE71FC41BC0889B694F4D6D03F7906A3D9A21705943CAF9632EEAFBB489503000D0004085370656E6447617303000D0004036761732D00012E010BD202964909436F6E73656E737573010140F1C0410D49A5EDF0945B0EE9FAFDF6CA1FC315118D545E07824BEF1BA1F00881C29419648FD0B8200A356D21FAF45C60F4B77279D931CE4D732F5896E93BFE0D'
    );
    done();
  });

  test('New MultiSig Tests', function (done) {
    let keys = PhantasmaKeys.fromWIF('L5UEVHBjujaR1721aZM5Zm5ayjDyamMZS9W35RE9Y9giRkdf3dVx');
    let nexusName = 'testnet';
    let chainName = 'main';
    let subject = 'teste';
    let listOfUsers: Array<string> = [
      keys.Address.Text,
      'P2KFEyFevpQfSaW8G4VjSmhWUZXR4QrG9YQR1HbMpTUCpCL',
    ];

    let time = new Timestamp(1234567890);
    let date = new Date(time.toString());
    let payload = Base16.encode(subject); // hex string
    var transaction = new Transaction(nexusName, chainName, '', date, payload);

    let gasLimit = 100000;
    let gasPrice = 210000;
    let txBytes = '';
    let sb = new ScriptBuilder();

    expect(Base16.encodeUint8Array(transaction.ToByteAray(false))).toBe(
      '07746573746E6574046D61696E00D2029649057465737465'
    );

    let script = sb
      //.AllowGas(keys.Address, Address.Null, gasLimit, gasPrice)
      .CallContract('consensus', 'CreateTransaction', [1, listOfUsers])
      //.SpendGas(keys.Address)
      .EndScript();

    expect(script).toBe(
      '0E0000000D01042F50324B464579466576705166536157384734566A536D6857555A585234517247395951523148624D7054554370434C0D020301002F0100020D01042F50324B464579466576705166536157384734566A536D6857555A585234517247395951523148624D7054554370434C0D020301012F01000203000D0003010103000D0004114372656174655472616E73616374696F6E03000D000409636F6E73656E7375732D00012E010B'
    );

    done();
  });

  test('New MultiSig With addressTests', function (done) {
    let keys = PhantasmaKeys.fromWIF('L5UEVHBjujaR1721aZM5Zm5ayjDyamMZS9W35RE9Y9giRkdf3dVx');
    let nexusName = 'testnet';
    let chainName = 'main';
    let subject = 'teste';
    let listOfUsers: Array<string> = [
      'P2KFEyFevpQfSaW8G4VjSmhWUZXR4QrG9YQR1HbMpTUCpCL',
      'P2KFEyFevpQfSaW8G4VjSmhWUZXR4QrG9YQR1HbMpTUCpCL',
    ];

    const listUserAddr = listOfUsers.map((user) => Address.FromText(user));

    let time = new Timestamp(1234567890);
    let date = new Date(time.toString());
    let payload = Base16.encode(subject); // hex string
    var transaction = new Transaction(nexusName, chainName, '', date, payload);

    let gasLimit = 100000;
    let gasPrice = 210000;
    //let txBytes = transaction.SerializeData();
    let sb = new ScriptBuilder();

    expect(Base16.encodeUint8Array(transaction.ToByteAray(false))).toBe(
      '07746573746E6574046D61696E00D2029649057465737465'
    );

    expect(Base16.encodeUint8Array(Serialization.Serialize(transaction))).toBe(
      '07746573746E6574046D61696E00D202964905746573746500'
    );

    let script = sb
      .AllowGas(keys.Address, Address.Null, gasLimit, gasPrice)
      .CallContract('consensus', 'CreateTransaction', [
        keys.Address.Text,
        subject,
        Serialization.Serialize(transaction),
        listUserAddr,
      ])
      .SpendGas(keys.Address)
      .EndScript();

    expect(script).toBe(
      '0D00030350340303000D000303A0860103000D000223220000000000000000000000000000000000000000000000000000000000000000000003000D000223220100AA53BE71FC41BC0889B694F4D6D03F7906A3D9A21705943CAF9632EEAFBB489503000D000408416C6C6F7747617303000D0004036761732D00012E010E0000000D010223220100AA53BE71FC41BC0889B694F4D6D03F7906A3D9A21705943CAF9632EEAFBB48950D020301002F0100020D010223220100AA53BE71FC41BC0889B694F4D6D03F7906A3D9A21705943CAF9632EEAFBB48950D020301012F01000203000D00021907746573746E6574046D61696E00D20296490574657374650003000D000405746573746503000D00042F50324B464579466576705166536157384734566A536D6857555A585234517247395951523148624D7054554370434C03000D0004114372656174655472616E73616374696F6E03000D000409636F6E73656E7375732D00012E010D000223220100AA53BE71FC41BC0889B694F4D6D03F7906A3D9A21705943CAF9632EEAFBB489503000D0004085370656E6447617303000D0004036761732D00012E010B'
    );

    done();
  });
  test('SimpleScript', function (done) {
    let keys = PhantasmaKeys.fromWIF('L5UEVHBjujaR1721aZM5Zm5ayjDyamMZS9W35RE9Y9giRkdf3dVx');

    let sb = new ScriptBuilder();

    let script = sb
      .CallContract('stake', 'Stake', [keys.Address.Text, keys.Address.Text])
      .EndScript();

    done();
  });

  test('Test ScriptBuilder', function (done) {
    let keys = PhantasmaKeys.fromWIF('L5UEVHBjujaR1721aZM5Zm5ayjDyamMZS9W35RE9Y9giRkdf3dVx');

    let sb = new ScriptBuilder();

    let amount = 10000000;
    let script = sb
      .AllowGas(keys.Address.Text, Address.NullText, 10000, 21000)
      .CallInterop('Runtime.TransferTokens', [
        keys.Address.Text,
        keys.Address.Text,
        'SOUL',
        String(amount),
      ])
      .SpendGas(keys.Address.Text)
      .EndScript();

    console.log('script', script);

    done();
  });
});
