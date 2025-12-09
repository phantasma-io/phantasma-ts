import { PhantasmaLink } from './phantasmaLink';
import { ProofOfWork } from './interfaces/ProofOfWork';
import { EasyScript, Nexus } from './easyScript';
import { TxMsg } from '../types/Carbon/Blockchain';

export class EasyConnect {
  requiredVersion: number;
  platform: string;
  providerHint: string;
  link: PhantasmaLink;
  connected: boolean;
  script: EasyScript;
  nexus: Nexus;

  constructor(_options: Array<string> = null) {
    this.platform = 'phantasma';
    this.providerHint = 'poltergeist';
    this.script = new EasyScript();
    this.link = new PhantasmaLink('easyConnect', false);
    this.connected = false;
    this.requiredVersion = 4;

    //Make This Auto In Future
    this.nexus = Nexus.Mainnet;

    if (_options == null) {
      this.setConfig('auto');
    } else {
      try {
        this.requiredVersion = Number(_options[0]);
        this.platform = _options[1];
        this.providerHint = _options[2];
      } catch (error) {
        console.log(error);
      }
    }
    this.script = new EasyScript();
  }

  setConfig(_provider: string) {
    this.requiredVersion = 4;
    this.platform = 'phantasma';

    switch (_provider) {
      case 'auto':
        // @ts-ignore
        if (!!window.PhantasmaLinkSocket == true) {
          this.setConfig('ecto');
        } else {
          this.providerHint = '';
        }
        break;

      case 'ecto':
        this.providerHint = 'ecto';
        break;

      case 'poltergeist':
        this.providerHint = 'poltergeist';
        break;
    }
  }

  connect(
    onSuccess: any = (data) => {},
    onFail: any = (data) => {
      console.log('%cError: ' + data, 'color:red');
    }
  ) {
    let that = this;

    this.link.login(
      function (data) {
        //Console Logging for Debugging Purposes
        if (data) {
          that.connected = true;
          onSuccess(data);
          console.log('%c[EasyConnect Connected]', 'color:green');
          console.log(
            "Wallet Address '" + that.link.account.address + "' connected via " + that.link.wallet
          );
        } else {
          onFail();
          console.log('EasyConnect could not connect to wallet');
        }
      },
      onFail,
      this.requiredVersion,
      this.platform,
      this.providerHint
    );
  }

  disconnect(_message: string = 'Graceful Disconect') {
    this.link.disconnect(_message);
    this.connected = false;
  }

  async query(
    _type: string = null,
    _arguments: Array<string> = null,
    _callback: any = (data) => {
      console.log(data);
    }
  ) {
    if (this.connected == true) {
      switch (_type) {
        case 'account':
          let account = this.link.account;
          _callback(account);
          return account;
          break;

        case 'name':
          let name = this.link.account.name;
          _callback(name);
          return name;
          break;

        case 'balances':
          let balances = this.link.account.balances;
          _callback(balances);
          return balances;
          break;

        case 'walletAddress':
          let walletAddress = this.link.account.address;
          _callback(walletAddress);
          return walletAddress;
          break;

        case 'avatar':
          let avatar = this.link.account.avatar;
          _callback(avatar);
          return avatar;
          break;

        case 'tokenBalance':
          //let token = _arguments[0];
          //return this.link.accounts[]
          break;
      }
    } else {
      console.log('%cWallet is not connected', 'color:red');
    }
  }

  async action(
    _type: string = null,
    _arguments: Array<any> = null,
    onSuccess: any = (data) => {},
    onFail: any = (data) => {
      console.log('%cError: ' + data, 'color:red');
    }
  ) {
    if (this.connected == true) {
      switch (_type) {
        case 'sendFT':
          let sendFTScript = await this.script.buildScript('interop', [
            'Runtime.SendTokens',
            [_arguments[0], _arguments[1], _arguments[2], _arguments[3]],
          ]);
          this.signTransaction(sendFTScript, null, onSuccess, onFail);
          break;

        case 'sendNFT':
          let sendNFTScript = await this.script.buildScript('interop', [
            'Runtime.SendTokens',
            [_arguments[0], _arguments[1], _arguments[2], _arguments[3]],
          ]);
          this.signTransaction(sendNFTScript, null, onSuccess, onFail);
          break;
      }
    } else {
      console.log('%cWallet is not connected', 'color:red');
    }
  }

  signTransaction(
    script: string,
    payload = null,
    onSuccess: any = (data) => {},
    onFail: any = (data) => {
      console.log('%cError: ' + data, 'color:red');
    }
  ) {
    this.link.signTx(script, payload, onSuccess, onFail);
  }

  signData(
    data: any,
    onSuccess: any = (data) => {},
    onFail: any = (data) => {
      console.log('%cError: ' + data, 'color:red');
    }
  ) {
    this.link.signData(data, onSuccess, onFail);
  }

  signCarbonTransaction(
    txMsg: TxMsg,
    onSuccess: any = (data) => {},
    onFail: any = (data) => {
      console.log('%cError: ' + data, 'color:red');
    }
  ) {
    if (this.connected == true) {
    this.link.signCarbonTxAndBroadcast(txMsg, onSuccess, onFail);
    } else {
      const message = 'Wallet is not connected';
      console.log('%c' + message, 'color:red');
      onFail(message);
    }
  }

  invokeScript(script: string, _callback: any) {
    this.link.invokeScript(script, _callback);
  }

  deployContract(
    script: string,
    payload = null,
    proofOfWork: ProofOfWork = ProofOfWork.Minimal,
    onSuccess: any = (data) => {},
    onFail: any = (data) => {
      console.log('%cError: ' + data, 'color:red');
    }
  ) {
    this.link.signTx(script, payload, onSuccess, onFail, proofOfWork);
  }
}
