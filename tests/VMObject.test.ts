import { BinaryReader, BinaryWriter } from 'csharp-binary-stream';
import { Type } from 'typescript';
import {
  Base16,
  PBinaryWriter,
  PollChoice,
  Serialization,
  Timestamp,
  Transaction,
  VMObject,
  VMType,
} from '../src/core';

describe('VM index file', () => {
  test('empty string should result in zero', () => {
    let vm = new VMObject();

    expect(vm).toBeInstanceOf(VMObject);
    expect(vm.Type).toBe(VMType.None);
  });

  test('String VM', () => {
    let vm = new VMObject();
    let myNewVM = VMObject.FromObject('MyString');

    expect(myNewVM).toBeInstanceOf(VMObject);
    expect(myNewVM.Type).toBe(VMType.String);
    let result = myNewVM.AsString();
    expect(result).toBe('MyString');
  });

  test('Number VM', () => {
    let vm = new VMObject();
    let myNewVM = VMObject.FromObject(5);

    expect(myNewVM).toBeInstanceOf(VMObject);
    expect(myNewVM.Type).toBe(VMType.Number);
    let result = myNewVM.AsString();
    expect(result).toBe('5');
    expect(myNewVM.AsNumber()).toBe(5);
  });

  /*test("Bool VM", () => {
    let vm = new phantasmaJS.VMObject();
    let myNewVM = VMObject.FromObject(true);

    expect(myNewVM).toBeInstanceOf(phantasmaJS.VMObject);
    expect(myNewVM.Type).toBe(phantasmaJS.VMType.Bool);
    expect(myNewVM.AsString()).toBe("true");
    expect(myNewVM.AsBool()).toBe(true);
  });

  test("Struct VM", () => {
    let vm = new phantasmaJS.VMObject();
    let choice = new phantasmaJS.PollChoice("myChoice");
    let myNewVM = VMObject.FromStruct(choice);

    expect(myNewVM).toBeInstanceOf(phantasmaJS.VMObject);
    expect(myNewVM.Type).toBe(phantasmaJS.VMType.Struct);
    let result = myNewVM.ToStruct(PollChoice) as PollChoice;
    expect(result).toStrictEqual(choice);
  });

  test("TestTypes", () => {
    let vm = new phantasmaJS.VMObject();
    let choice = new phantasmaJS.PollChoice("myChoice");
    let myNewVM = VMObject.FromStruct(choice);

    expect(VMObject.isPrimitive(PollChoice)).toBe(false);
    expect(VMObject.isValueType(PollChoice)).toBe(false);
    expect(VMObject.isClass(PollChoice)).toBe(true);
    expect(VMObject.isEnum(PollChoice)).toBe(false);
    expect(VMObject.isSerializable(PollChoice)).toBe(true);
    expect(VMObject.isInterface(PollChoice)).toBe(false);
    expect(VMObject.isStructOrClass(PollChoice as unknown as Type)).toBe(true);
    expect(myNewVM.Type).toBe(phantasmaJS.VMType.Struct);
  });*/

  test('PollChoices', () => {
    let vm = new VMObject();
    let choice = new PollChoice('myChoice');
    let choice2 = new PollChoice('myChoice');
    let choices: PollChoice[] = [choice, choice2];
    let myNewVM = VMObject.FromArray(choices);

    expect(myNewVM).toBeInstanceOf(VMObject);
    expect(myNewVM.Type).toBe(VMType.Struct);
    //let result = myNewVM.ToArray(PollChoice) as PollChoice[];
    //expect(result).toStrictEqual(choices);
  });

  test('Serialization', () => {
    let vm = new VMObject();
    let choice = new PollChoice('myChoice');
    let choice2 = new PollChoice('myChoice');
    let time = new Timestamp(10000);
    let choices: PollChoice[] = [choice, choice2];

    class myTestClass {
      name: string = 'test';
      choices: PollChoice[] = choices;
      time: Timestamp = time;
      constructor() {}
    }

    let testClass = new myTestClass();

    let choice1Serialized = Serialization.Serialize(testClass);
    let choice1Deserialized = Serialization.Unserialize<myTestClass>(
      choice1Serialized,
      myTestClass
    );

    let myVM = VMObject.FromObject(choice1Serialized);
    let writer = new PBinaryWriter();
    let result = myVM.SerializeData(writer);

    /*let choicesSerialized: Uint8Array[] = [
      Serialization.Serialize(choice),
      Serialization.Serialize(choice2),
    ];
    let myNewVM = VMObject.FromArray(choices);

    expect(myNewVM).toBeInstanceOf(phantasmaJS.VMObject);
    expect(myNewVM.Type).toBe(phantasmaJS.VMType.Struct);
    let writer = new PBinaryWriter();
    let result = myNewVM.SerializeData(writer);
    expect(writer.toArray()).toStrictEqual(choices);*/
  });

  test('Serialization2', () => {
    let choice = new PollChoice('myChoice');
    let choice2 = new PollChoice('myChoice');
    let choices: PollChoice[] = [choice, choice2];
    let choicesSerialized = Serialization.Serialize(choices);
  });

  test('DecodeBool', () => {
    let vmCode = '0601';
    let bytes = Base16.decodeUint8Array(vmCode);
    let vm = VMObject.FromBytes(bytes);

    expect(vm.Type).toBe(VMType.Bool);
    expect(vm.AsBool()).toBe(true);
  });
});
