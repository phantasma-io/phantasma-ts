import Buffer from 'buffer';
import { PollChoice } from '../../src';
import {
  Address,
  Base16,
  Ed25519Signature,
  PBinaryWriter,
  PhantasmaKeys,
  ScriptBuilder,
  Serialization,
  stringToUint8Array,
  Timestamp,
  Transaction,
  bytesToHex,
} from '../../src/core';

describe('test phantasma_ts', function () {
  test('test phantasma-ts.Transaction.SerializeData', function (done) {
    const writer = new PBinaryWriter();
    const keys = PhantasmaKeys.generate();

    const nexusName = 'nexus';
    const chainName = 'main';
    const script = 'script';
    const expiration = new Date(17898129498);
    const payload = bytesToHex(new TextEncoder().encode('payload'));
    /*let signatures = [*/ new Ed25519Signature() /*]*/;
    writer.writeString(nexusName);
    const tx = new Transaction(nexusName, chainName, script, expiration, payload);
    tx.signWithKeys(keys);
    tx.SerializeData(writer);
    /*expect(writer.toUint8Array()).toBe([
      5, 110, 101, 120, 117, 115, 5, 110, 101, 120, 117, 115, 5, 109, 97, 105,
      110,
    ]);*/
    done();
  });

  test('signature', function (done) {
    // const writer = new PBinaryWriter();
    const keys = PhantasmaKeys.generate();

    const wifTest = 'L5UEVHBjujaR1721aZM5Zm5ayjDyamMZS9W35RE9Y9giRkdf3dVx';
    const keyFromWif = PhantasmaKeys.fromWIF(wifTest);

    expect(keyFromWif.toWIF()).toBe(wifTest);

    const nexusName = 'nexus';
    const chainName = 'main';
    const script = 'script';
    const expiration = new Date(17898129498);
    const payload = bytesToHex(new TextEncoder().encode('payload'));
    const tx = new Transaction(nexusName, chainName, script, expiration, payload);

    const wif = keys.toWIF();
    const pk = bytesToHex(keys.PrivateKey);

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
    const nexusName = 'testnet';
    const chainName = 'main';
    const wif = 'L5UEVHBjujaR1721aZM5Zm5ayjDyamMZS9W35RE9Y9giRkdf3dVx';
    const uintArray = Uint8Array.from([0x01, 0x02, 0x03]);
    const script = bytesToHex(uintArray);
    const time = new Timestamp(1234567890);
    const date = new Date(time.toString());
    const payload = bytesToHex(new TextEncoder().encode('payload'));
    const keys = PhantasmaKeys.fromWIF(wif);
    const tx = new Transaction(nexusName, chainName, script, date, payload);

    tx.signWithKeys(keys);

    const fromCsharp =
      '07746573746E6574046D61696E03010203D2029649077061796C6F61640101404C033859A20A4FC2E469B3741FB05ACEDFEC24BFE92E07633680488665D79F916773FF40D0E81C4468E1C1487E6E1E6EEFDA5C5D7C53C15C4FB349C2349A1802';
    const fromCsharpBytes = Buffer.Buffer.from(fromCsharp, 'hex');
    /*const bytes =*/ stringToUint8Array(fromCsharp);
    const fromCsharpTx = Transaction.Unserialize(fromCsharpBytes);

    expect(fromCsharpTx.chainName).toBe(tx.chainName);
    expect(fromCsharpTx.nexusName).toBe(tx.nexusName);
    expect(fromCsharpTx.script).toBe(tx.script);
    expect(fromCsharpTx.payload).toBe(tx.payload);
    expect(fromCsharpTx.expiration).toStrictEqual(tx.expiration);
    expect(fromCsharpTx.signatures.length).toBe(tx.signatures.length);
    expect(fromCsharpTx.signatures[0].Kind).toBe(tx.signatures[0].Kind);
    expect(fromCsharpTx.signatures[0].ToByteArray()).toStrictEqual(tx.signatures[0].ToByteArray());

    done();
  });

  test('Transaction Serialized to bytes', function (done) {
    const nexusName = 'testnet';
    const chainName = 'main';
    const subject = 'system.nexus.protocol.version';
    const wif = 'L5UEVHBjujaR1721aZM5Zm5ayjDyamMZS9W35RE9Y9giRkdf3dVx';
    // const mode = 1;
    const choice = new PollChoice('myChoice');
    const choice2 = new PollChoice('myChoice');
    const choices = [choice, choice2];
    /*const choicesSerialized =*/ Serialization.Serialize(choices);
    const time = new Timestamp(1234567890);
    const date = new Date(time.toString());
    // const startTime = time;
    /*const endTime =*/ new Timestamp(time.value + 86400);
    const payload = Base16.encode('Consensus'); // hex string

    const keys = PhantasmaKeys.fromWIF(wif);
    const sb = new ScriptBuilder();

    const gasLimit = 10000;
    const gasPrice = 210000;

    const script = sb
      .AllowGas(keys.Address, Address.Null, gasLimit, gasPrice)
      .CallContract('consensus', 'SingleVote', [keys.Address.Text, subject, 0])
      .SpendGas(keys.Address)
      .EndScript();

    expect(script).toBe(
      '0D00040632313030303003000D000405313030303003000D000223220000000000000000000000000000000000000000000000000000000000000000000003000D000223220100AA53BE71FC41BC0889B694F4D6D03F7906A3D9A21705943CAF9632EEAFBB489503000D000408416C6C6F7747617303000D0004036761732D00012E010D0004013003000D00041D73797374656D2E6E657875732E70726F746F636F6C2E76657273696F6E03000D00042F50324B464579466576705166536157384734566A536D6857555A585234517247395951523148624D7054554370434C03000D00040A53696E676C65566F746503000D000409636F6E73656E7375732D00012E010D000223220100AA53BE71FC41BC0889B694F4D6D03F7906A3D9A21705943CAF9632EEAFBB489503000D0004085370656E6447617303000D0004036761732D00012E010B'
    );

    const tx = new Transaction(nexusName, chainName, script, date, payload);

    tx.signWithKeys(keys);

    expect(bytesToHex(tx.ToByteAray(true)).toUpperCase()).toBe(
      '07746573746E6574046D61696EFD48010D00040632313030303003000D000405313030303003000D000223220000000000000000000000000000000000000000000000000000000000000000000003000D000223220100AA53BE71FC41BC0889B694F4D6D03F7906A3D9A21705943CAF9632EEAFBB489503000D000408416C6C6F7747617303000D0004036761732D00012E010D0004013003000D00041D73797374656D2E6E657875732E70726F746F636F6C2E76657273696F6E03000D00042F50324B464579466576705166536157384734566A536D6857555A585234517247395951523148624D7054554370434C03000D00040A53696E676C65566F746503000D000409636F6E73656E7375732D00012E010D000223220100AA53BE71FC41BC0889B694F4D6D03F7906A3D9A21705943CAF9632EEAFBB489503000D0004085370656E6447617303000D0004036761732D00012E010BD202964909436F6E73656E737573010140016F0F8D6C38E37F00C9CE9969104F42AF933BEB8C4291CBC9107CD11FDC6CBBDA86ACCD731742EA01642A26D14CA7E56361E73997BB3BEA55BAA3911AB62002'
    );
    done();
  });

  test('New MultiSig Tests', function (done) {
    const keys = PhantasmaKeys.fromWIF('L5UEVHBjujaR1721aZM5Zm5ayjDyamMZS9W35RE9Y9giRkdf3dVx');
    const nexusName = 'testnet';
    const chainName = 'main';
    const subject = 'teste';
    const listOfUsers: Array<string> = [
      keys.Address.Text,
      'P2KFEyFevpQfSaW8G4VjSmhWUZXR4QrG9YQR1HbMpTUCpCL',
    ];

    const time = new Timestamp(1234567890);
    const date = new Date(time.toString());
    const payload = Base16.encode(subject); // hex string
    const transaction = new Transaction(nexusName, chainName, '', date, payload);

    // const gasLimit = 100000;
    // const gasPrice = 210000;
    // const txBytes = '';
    const sb = new ScriptBuilder();

    expect(Base16.encodeUint8Array(transaction.ToByteAray(false))).toBe(
      '07746573746E6574046D61696E00D2029649057465737465'
    );

    const script = sb
      //.AllowGas(keys.Address, Address.Null, gasLimit, gasPrice)
      .CallContract('consensus', 'CreateTransaction', [1, listOfUsers])
      //.SpendGas(keys.Address)
      .EndScript();

    expect(script).toBe(
      '0E0000000D01042F50324B464579466576705166536157384734566A536D6857555A585234517247395951523148624D7054554370434C0D020401302F0100020D01042F50324B464579466576705166536157384734566A536D6857555A585234517247395951523148624D7054554370434C0D020401312F01000203000D0004013103000D0004114372656174655472616E73616374696F6E03000D000409636F6E73656E7375732D00012E010B'
    );

    done();
  });

  test('New MultiSig With addressTests', function (done) {
    const keys = PhantasmaKeys.fromWIF('L5UEVHBjujaR1721aZM5Zm5ayjDyamMZS9W35RE9Y9giRkdf3dVx');
    const nexusName = 'testnet';
    const chainName = 'main';
    const subject = 'teste';
    const listOfUsers: Array<string> = [
      'P2KFEyFevpQfSaW8G4VjSmhWUZXR4QrG9YQR1HbMpTUCpCL',
      'P2KFEyFevpQfSaW8G4VjSmhWUZXR4QrG9YQR1HbMpTUCpCL',
    ];

    const listUserAddr = listOfUsers.map((user) => Address.FromText(user));

    const time = new Timestamp(1234567890);
    const date = new Date(time.toString());
    const payload = Base16.encode(subject); // hex string
    const transaction = new Transaction(nexusName, chainName, '', date, payload);

    const gasLimit = 100000;
    const gasPrice = 210000;
    //let txBytes = transaction.SerializeData();
    const sb = new ScriptBuilder();

    expect(Base16.encodeUint8Array(transaction.ToByteAray(false))).toBe(
      '07746573746E6574046D61696E00D2029649057465737465'
    );

    expect(Base16.encodeUint8Array(Serialization.Serialize(transaction))).toBe(
      '07746573746E6574046D61696E00D202964905746573746500'
    );

    const script = sb
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
      '0D00040632313030303003000D00040631303030303003000D000223220000000000000000000000000000000000000000000000000000000000000000000003000D000223220100AA53BE71FC41BC0889B694F4D6D03F7906A3D9A21705943CAF9632EEAFBB489503000D000408416C6C6F7747617303000D0004036761732D00012E010E0000000D010223220100AA53BE71FC41BC0889B694F4D6D03F7906A3D9A21705943CAF9632EEAFBB48950D020401302F0100020D010223220100AA53BE71FC41BC0889B694F4D6D03F7906A3D9A21705943CAF9632EEAFBB48950D020401312F01000203000D00021907746573746E6574046D61696E00D20296490574657374650003000D000405746573746503000D00042F50324B464579466576705166536157384734566A536D6857555A585234517247395951523148624D7054554370434C03000D0004114372656174655472616E73616374696F6E03000D000409636F6E73656E7375732D00012E010D000223220100AA53BE71FC41BC0889B694F4D6D03F7906A3D9A21705943CAF9632EEAFBB489503000D0004085370656E6447617303000D0004036761732D00012E010B'
    );

    done();
  });
  test('SimpleScript', function (done) {
    const keys = PhantasmaKeys.fromWIF('L5UEVHBjujaR1721aZM5Zm5ayjDyamMZS9W35RE9Y9giRkdf3dVx');

    const sb = new ScriptBuilder();

    /*const script =*/ sb.CallContract('stake', 'Stake', [
      keys.Address.Text,
      keys.Address.Text,
    ]).EndScript();

    done();
  });

  test('Test ScriptBuilder', function (done) {
    const keys = PhantasmaKeys.fromWIF('L5UEVHBjujaR1721aZM5Zm5ayjDyamMZS9W35RE9Y9giRkdf3dVx');

    const sb = new ScriptBuilder();

    const amount = 10000000;
    /*const script =*/ sb.AllowGas(keys.Address.Text, Address.NullText, 10000, 21000)
      .CallInterop('Runtime.TransferTokens', [keys.Address.Text, keys.Address.Text, 'SOUL', amount])
      .SpendGas(keys.Address.Text)
      .EndScript();

    // console.log('script', script);

    done();
  });
});
