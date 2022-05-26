const Web3 = require('web3');
var Contract = require('web3-eth-contract');
import MetaMaskOnboarding from '@metamask/onboarding'
import nfstakerAbi from './abi/nfstaker'
import nftAbi from './abi/nft'

let nfstakerAddress;
let nftAddress;
let tokenAddress;
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

// Connected Account Section
const accountsDiv = document.getElementById('accounts')

// Actions Section
const onboardButton = document.getElementById('connectButton')
const stakeDropdwn = document.getElementById('dd')
const unstakeDropdwn = document.getElementById('ddu')
const stakeTokenId = document.getElementById('tid1')

const initialize = async () => {

  let onboarding
  try {
    onboarding = new MetaMaskOnboarding({ forwarderOrigin })
  } catch (error) {
    console.error(error)
  }
  const web3 = new Web3(window.ethereum);
  let accounts = await web3.eth.getAccounts();
  nfstakerAddress = "0x417BA49F37ecA03f183988D586291DEA43321d90";
  nftAddress = "0xD0481856Cc423651233920Ed3092579c0cB1Db6a";
  tokenAddress = "0xE6a0b70cE16df89941b1e15aC1bD8D7CA36131B6";
  nfstakerContract = new web3.eth.Contract(nfstakerAbi, nfstakerAddress);
  popContract = new web3.eth.Contract(nftAbi, tokenAddress);
  nftContract = new web3.eth.Contract(nftAbi, nftAddress);
  
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
    nftContract.methods.approve(nfstakerAddress,id).send({from:accounts[0]}).on('receipt', function(){
      console.log("approved");
      nfstakerContract.methods.stake(address,id).send({from:accounts[0]}).on('receipt', function(){
        console.log("staked!");
        alert("staked!");
        }).on('error', function(){
          console.log("staking failed!");
          alert("staking failed!");
      });
    }).on('error', function(){
      console.log("Approval failed");
      alert("Approval failed");
    }); 
  }

  const unstake = async (address) => {
    const stakingAmount = await nfstakerContract.methods.getStakingAmountOf(address).call();
    const ids = await nfstakerContract.methods.getStakedIds(accounts[0],address).call();
    console.log(ids);
    popContract.methods.approve(nfstakerAddress,stakingAmount).send({from:accounts[0]}).on('receipt', function(){
      console.log("approved");
      nfstakerContract.methods.unstake(nftAddress,ids[0],10).send({from:accounts[0]}).on('receipt', function(){
        console.log("unstaked!");
        alert("unstaked!");
        }).on('error', function(){
          console.log("unstaking failed!");
          alert("staking failed!");
      });
    }).on('error', function(){
      console.log("Approvael failed");
      alert("Approval failed");
    }); 
  }

  const initializeAccountButtons = async () => {

    const allAddreses = await nfstakerContract.methods.getAllNftsAddresses().call();
    for (var item in allAddreses) {
      var opt = document.createElement('a');
      opt.setAttribute("class", "dropdown-item");
      opt.setAttribute("href", "#");
      opt.innerHTML = allAddreses[item];
      stakeDropdwn.appendChild(opt);
    }

    $('#dd a').on('click', function(){
      console.log(stakeTokenId.value)
      if (stakeTokenId.value != '') {
        stake($(this).html(),parseInt(stakeTokenId.value));
      } else {
        alert("Type an NFT Token Id");
      }
    });

    const ownerAddreses = await nfstakerContract.methods.getNftsAddressesOf(accounts[0]).call();
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
      unstake($(this).html());
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

  updateButtons()

  if (isMetaMaskInstalled()) {
    ethereum.autoRefreshOnNetworkChange = false
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