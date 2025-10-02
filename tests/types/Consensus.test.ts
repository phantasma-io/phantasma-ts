import {
  Base16,
  ConsensusPoll,
  hexStringToUint8Array,
  PBinaryReader,
  PollValue,
  Serialization,
  stringToUint8Array,
  uint8ArrayToString,
  uint8ArrayToStringDefault,
  VMObject,
} from '../../src/core';

describe('Consensus Tests', () => {
  test('Consensus Array Unserialize', function (done) {
    const SerializeData =
      '010203010008B401020301000850166E657875732E70726F746F636F6C2E76657273696F6E0A76616C696461746F7273010102000000013903FFFFFF03F4010002313003FFFFFF010002010027E1CF638B3FD16302010002050080C613000302010008571D73797374656D2E6E657875732E70726F746F636F6C2E76657273696F6E0A76616C696461746F7273010102000000013903FFFFFF03F4010002313003FFFFFF01000201005550D163D5A1D26302010002050080C613000302010008B401020301000850166E657875732E70726F746F636F6C2E76657273696F6E0A76616C696461746F7273010102000000013903FFFFFF03F4010002313003FFFFFF010002010027E1CF638B3FD16302010002050080C613000302010008571D73797374656D2E6E657875732E70726F746F636F6C2E76657273696F6E0A76616C696461746F7273010102000000013903FFFFFF03F4010002313003FFFFFF01000201005550D163D5A1D26302010002050080C61300';

    /*const arrayBytes = Base16.decodeUint8Array(SerializeData);
    const readerVM = new PBinaryReader(arrayBytes);
    const vm = new VMObject();
    vm.UnserializeData(readerVM);
    for (let map of vm.GetChildren()![1]) {
      console.log(map[0], " - ", map[1]);
      let lBytes = Base16.decodeUint8Array(
        uint8ArrayToStringDefault(map[1].AsByteArray())
      );
    }*/

    //const consensus = Serialization.Unserialize(reader, Array<ConsensusPoll>);
    //console.log(arrayBytes);
    done();
  });

  test('Consensus Single Unserialize', function (done) {
    const SerializeData =
      '010B04077375626A656374041D73797374656D2E6E657875732E70726F746F636F6C2E76657273696F6E040C6F7267616E697A6174696F6E040A76616C696461746F727304046D6F646507010405737461746507010407656E74726965730102030100080A013903FFFFFF03F4010003020100080902313003FFFFFF01000405726F756E64030201000409737461727454696D65055550D1630407656E6454696D6505D5A1D263040E63686F696365735065725573657203020100040A746F74616C566F74657303020500040D636F6E73656E73757354696D650580C61300';

    const arrayBytes = Base16.decodeUint8Array(SerializeData);
    const vm = new VMObject();
    const readerVM = new PBinaryReader(arrayBytes);
    vm.UnserializeData(readerVM);
    let con = vm.ToStruct<ConsensusPoll>(ConsensusPoll);
    con.entries.forEach((entry) => {
      //console.log(entry);
      let entryValue = entry as unknown as string;
      let pollValueBytes = Base16.decodeUint8Array(entryValue);
      let pollValue = new PollValue();
      let reader = new PBinaryReader(pollValueBytes);
      pollValue.UnserializeData(reader);
      //console.log(pollValue);

      //pollValue.UnserializeData(reader);

      //console.log(reader.read());
    });
    expect(con.subject).toBe('system.nexus.protocol.version');
    expect(con.organization).toBe('validators');
    expect(con.mode).toBe(1);
    expect(con.state).toBe(1);
    expect(con.startTime.value).toBe(1674661973);
    expect(con.endTime.value).toBe(1674748373);
    expect(con.choicesPerUser).toBe(1);
    expect(con.totalVotes).toBe(5);
    done();
  });
});
