import { Address } from './Address.js';
import { Timestamp } from './Timestamp.js';

export enum TriggerResult {
  Failure,
  Missing,
  Success,
}

export enum AccountTrigger {
  OnMint, // address, symbol, amount
  OnBurn, // address, symbol, amount
  OnSend, // address, symbol, amount
  OnReceive, // address, symbol, amount
  OnWitness, // address
  OnUpgrade, // address
  OnMigrate, // from, to
  OnKill, // address
}

export enum TokenTrigger {
  OnMint, // address, symbol, amount
  OnBurn, // address, symbol, amount
  OnSend, // address, symbol, amount
  OnReceive, // address, symbol, amount
  OnInfuse, // address, symbol, amount
  OnUpgrade, // address
  OnSeries, // address
  OnWrite, // address, data
  OnMigrate, // from, to
  OnKill, // address
}

export enum OrganizationTrigger {
  OnAdd, // address
  OnRemove, // address
  OnUpgrade, // address
}

export class StakeReward {
  staker: Address;
  date: Timestamp;

  constructor(staker: Address, date: Timestamp) {
    this.staker = staker;
    this.date = date;
  }
}

export class DomainSettings {
  public static LatestKnownProtocol = 19;

  public static Phantasma20Protocol = 7;
  public static Phantasma30Protocol = 8;

  public static MaxTxPerBlock = 1024;

  public static MaxOracleEntriesPerBlock = 5120;

  public static MaxEventsPerBlock = 2048;

  public static MaxEventsPerTx = 8096;

  public static MaxTriggerLoop = 5;

  public static MAX_TOKEN_DECIMALS = 18;

  public static DefaultMinimumGasFee = 100000;
  public static InitialValidatorCount = 4;

  public static FuelTokenSymbol = 'KCAL';
  public static FuelTokenName = 'Phantasma Energy';
  public static FuelTokenDecimals = 10;

  public static NexusMainnet = 'mainnet';
  public static NexusTestnet = 'testnet';

  public static StakingTokenSymbol = 'SOUL';
  public static StakingTokenName = 'Phantasma Stake';
  public static StakingTokenDecimals = 8;

  public static FiatTokenSymbol = 'USD';
  public static FiatTokenName = 'Dollars';
  public static FiatTokenDecimals = 8;

  public static RewardTokenSymbol = 'CROWN';
  public static RewardTokenName = 'Phantasma Crown';

  public static LiquidityTokenSymbol = 'LP';
  public static LiquidityTokenName = 'Phantasma Liquidity';
  public static LiquidityTokenDecimals = 8;

  public static FuelPerContractDeployTag = 'nexus.contract.cost';
  public static FuelPerTokenDeployTag = 'nexus.token.cost';
  public static FuelPerOrganizationDeployTag = 'nexus.organization.cost';

  public static SystemTokens = [
    DomainSettings.FuelTokenSymbol,
    DomainSettings.StakingTokenSymbol,
    DomainSettings.FiatTokenSymbol,
    DomainSettings.RewardTokenSymbol,
    DomainSettings.LiquidityTokenSymbol,
  ];

  public static RootChainName = 'main';

  public static ValidatorsOrganizationName = 'validators';
  public static MastersOrganizationName = 'masters';
  public static StakersOrganizationName = 'stakers';

  public static PhantomForceOrganizationName = 'phantom_force';

  //public static PlatformSupply = UnitConversion.ToBigInteger(100000000, FuelTokenDecimals);
  public static PlatformName = 'phantasma';

  public static ArchiveMinSize = 64;
  public static ArchiveMaxSize = 104857600;
  //public static ArchiveBlockSize = MerkleTree.ChunkSize;

  public static InfusionName = 'infusion';
  //public static InfusionAddress = SmartContract.GetAddressFromContractName(InfusionName);

  public static NameMaxLength = 255;
  public static UrlMaxLength = 2048;
  public static ArgsMax = 64;
  public static AddressMaxSize = 34;
  public static ScriptMaxSize = 32767;
  public static FieldMaxLength = 80;
  public static FieldMinLength = 1;
}
