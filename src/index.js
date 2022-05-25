const Web3 = require('web3');
var Contract = require('web3-eth-contract');
import MetaMaskOnboarding from '@metamask/onboarding'
import nfstakerAbi from './abi/nfstaker'
import nftAbi from './abi/nft'

let nfstakerContract;
let nftContract;
let popContract;

const currentUrl = new URL(window.location.href)
const forwarderOrigin = currentUrl.hostname === 'localhost'
  ? 'http://localhost:9010'
  : undefined

const isMetaMaskInstalled = () => {
  const { ethereum } = window
  return Boolean(ethereum && ethereum.isMetaMask)
}

// Dapp Status Section
const networkDiv = document.getElementById('network')
const chainIdDiv = document.getElementById('chainId')
const accountsDiv = document.getElementById('accounts')

// Basic Actions Section
const onboardButton = document.getElementById('connectButton')
const stakeDropdwn = document.getElementById('dd')
const unstakeDropdwn = document.getElementById('ddu')

window.onload = function() { 
  
};

const initialize = async () => {

  let onboarding
  try {
    onboarding = new MetaMaskOnboarding({ forwarderOrigin })
  } catch (error) {
    console.error(error)
  }

  let accountButtonsInitialized = false

  const accountButtons = [
  ]

  const web3 = new Web3(window.ethereum);
  let accounts = await web3.eth.getAccounts();
  nfstakerContract = new web3.eth.Contract(nfstakerAbi, "0x0D87577C8cEca60920186fE7530aC14B73BbD335");
  nftContract = new web3.eth.Contract(nftAbi, "0x74acac453a92a846a7280FB09b486c4a67896f24");
  popContract = new web3.eth.Contract(nftAbi, "0x3FE3D809C8Ae3243bFf003784B77ECb415b5e6b6");
  const isMetaMaskConnected = () => accounts && accounts.length > 0

  const onClickInstall = () => {
    onboardButton.innerText = 'Onboarding in progress'
    onboardButton.disabled = true
    onboarding.startOnboarding()
  }

  const onClickConnect = async () => {
    try {
      const newAccounts = await ethereum.request({
        method: 'eth_requestAccounts',
      })
      handleNewAccounts(newAccounts)
    } catch (error) {
      console.error(error)
    }
  }

  const updateButtons = () => {
    if (!isMetaMaskInstalled()) {
      onboardButton.innerText = 'Click here to install MetaMask!'
      onboardButton.onclick = onClickInstall
      onboardButton.disabled = false
    } else if (isMetaMaskConnected()) {
      onboardButton.innerText = 'Connected'
      onboardButton.disabled = true
      if (onboarding) {
        onboarding.stopOnboarding()
      }
    } else {
      onboardButton.innerText = 'Connect'
      onboardButton.onclick = onClickConnect
      onboardButton.disabled = false
    }
  }

  const stake = async (address,id) => {
    nftContract.methods.approve("0x0D87577C8cEca60920186fE7530aC14B73BbD335",id).send({from:accounts[0]}).on('receipt', function(){
      console.log("approved");
      nfstakerContract.methods.stake(address,id).send({from:accounts[0]}).on('receipt', function(){
        console.log("success");
        }).on('error', function(){
          console.log("error");
      });
    }).on('error', function(){
      console.log("error");
    }); 
  }

  const unstake = async (address,id,amount) => {
    popContract.methods.approve("0x0D87577C8cEca60920186fE7530aC14B73BbD335",amount).send({from:accounts[0]}).on('receipt', function(){
      console.log("approved");
      nfstakerContract.methods.unstake(address,id,amount).send({from:accounts[0]}).on('receipt', function(){
        console.log("success");
        }).on('error', function(){
          console.log("error");
      });
    }).on('error', function(){
      console.log("error");
    }); 
  }

  const initializeAccountButtons = async () => {

    const allAddreses = await nfstakerContract.methods.getNftsAdressesList().call();
    for (var item in allAddreses) {
      var opt = document.createElement('a');
      opt.setAttribute("class", "dropdown-item");
      opt.setAttribute("href", "#");
      opt.innerHTML = allAddreses[item];
      stakeDropdwn.appendChild(opt);
    }

    $('#dd a').on('click', function(){
      stake($(this).html(),3);
    });

    const ownerAddreses = await nfstakerContract.methods.getNftsAdresses(accounts[0]).call();
    console.log(ownerAddreses);
    for (var item in ownerAddreses) {
      console.log(ownerAddreses[item]);
      var opt = document.createElement('a');
      opt.setAttribute("class", "dropdown-item");
      opt.setAttribute("href", "#");
      opt.innerHTML = ownerAddreses[item];
      unstakeDropdwn.appendChild(opt);
    }

    $('#ddu a').on('click', function(){
      unstake($(this).html(),3,10);
    });

  }

  function handleNewAccounts (newAccounts) {
    accounts = newAccounts
    accountsDiv.innerHTML = accounts
    if (isMetaMaskConnected()) {
      initializeAccountButtons()
    }
    updateButtons()
  }

  function handleNewChain (chainId) {
    chainIdDiv.innerHTML = chainId
  }

  function handleNewNetwork (networkId) {
    networkDiv.innerHTML = networkId
  }

  async function getNetworkAndChainId () {
    try {
      const chainId = await ethereum.request({
        method: 'eth_chainId',
      })
      handleNewChain(chainId)

      const networkId = await ethereum.request({
        method: 'net_version',
      })
      handleNewNetwork(networkId)
    } catch (err) {
      console.error(err)
    }
  }

  updateButtons()

  if (isMetaMaskInstalled()) {

    ethereum.autoRefreshOnNetworkChange = false
    getNetworkAndChainId()

    ethereum.on('chainChanged', handleNewChain)
    ethereum.on('networkChanged', handleNewNetwork)
    ethereum.on('accountsChanged', handleNewAccounts)

    try {
      const newAccounts = await ethereum.request({
        method: 'eth_accounts',
      })
      handleNewAccounts(newAccounts)
    } catch (err) {
      console.error('Error on init when getting accounts', err)
    }
  }
}

window.addEventListener('DOMContentLoaded', initialize)

