import { BigNumber, Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import tokendata from './Tokendata.json'
import nftdata from './NFTdata.json'
import styles from '../styles/Token.module.css'
export default function Home() {
    // Create a BigNumber `0`
    const zero = BigNumber.from(0)
    // walletConnected keeps track of whether the user's wallet is connected or not
    const [walletConnected, setWalletConnected] = useState(false);
    // loading is set to true when we are waiting for a transaction to get mined
    const [loading, setLoading] = useState(false);
    const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
    // balanceOfCryptoDevTokens keeps track of number of Crypto Dev tokens owned by an address
    const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] = useState(zero);
    // amount of the tokens that the user wants to mint
    const [tokenAmount, setTokenAmount] = useState(zero);
    // tokensMinted is the total number of tokens that have been minted till now out of 10000(max total supply)
    const [tokensMinted, setTokensMinted] = useState(zero);
    // isOwner gets the owner of the contract through the signed address
    const [isOwner, setIsOwner] = useState(false);
    // Create a reference to the Web3 Modal 
    const web3ModalRef = useRef();
    const getTokensToBeClaimed = async () => {
        try {
            // Get the provider from web3Modal, which in our case is MetaMask
            // No need for the Signer here, as we are only reading state from the blockchain
            const provider = await getProviderOrSigner();
            // Create an instance of NFT Contract
            const nftContract = new Contract(
                nftdata.address,
                nftdata.abi,
                provider
            );
            // Create an instance of tokenContract
            const tokenContract = new Contract(
                tokendata.address,
                tokendata.abi,
                provider
            );
            // We will get the signer now to extract the address of the currently connected MetaMask account
            const signer = await getProviderOrSigner(true);
            const address = await signer.getAddress();
            // call the balanceOf from the NFT contract to get the number of NFT's hold by the user
            const balance = await nftContract.balanceOf(address);
            // balance is a Big number and thus we would compare it with Big number `zero`
            if (balance === zero) {
                setTokensToBeClaimed(zero); //nft token
            } else {
                // amount keeps track of the number of unclaimed tokens
                var amount = 0;
                // For all the NFT's, check if the tokens have already been claimed
                // Only increase the amount if the tokens have not been claimed
                // for a an NFT(for a given tokenId)
                for (var i = 0; i < balance; i++) {
                    const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
                    const claimed = await tokenContract.tokenIdsClaimed(tokenId);
                    if (!claimed) {
                        amount++;
                    }
                }
                //tokensToBeClaimed has been initialized to a Big Number, thus we would convert amount
                // to a big number and then set its value
                setTokensToBeClaimed(BigNumber.from(amount));
            }
        } catch (err) {
            alert(err.reason)
            setTokensToBeClaimed(zero);
        }
    };
    //check how many address hold gang token
    const getBalanceOfCryptoDevTokens = async () => {
        try {
            // Get the provider from web3Modal, which in our case is MetaMask
            // No need for the Signer here, as we are only reading state from the blockchain
            const provider = await getProviderOrSigner();
            // Create an instace of token contract
            const tokenContract = new Contract(
                tokendata.address,
                tokendata.abi,
                provider
            );
            // We will get the signer now to extract the address of the currently connected MetaMask account
            const signer = await getProviderOrSigner(true);
            // Get the address associated to the signer which is connected to  MetaMask
            const address = await signer.getAddress();
            // call the balanceOf from the token contract to get the number of tokens held by the user
            const balance = await tokenContract.balanceOf(address);
            // balance is already a big number, so we dont need to convert it before setting it
            setBalanceOfCryptoDevTokens(balance);
        } catch (err) {
            alert(err.reason)
            setBalanceOfCryptoDevTokens(zero);
        }

    };


    const mintCryptoDevToken = async (amount) => {
        try {
            // We need a Signer here since this is a 'write' transaction.
            // Create an instance of tokenContract
            const signer = await getProviderOrSigner(true);
            // Create an instance of tokenContract
            const tokenContract = new Contract(
                tokendata.address,
                tokendata.abi,
                signer
            );
            // Each token is of `0.001 ether`. The value we need to send is `0.001 * amount`
            const value = 0.001 * amount;
            const tx = await tokenContract.mint(amount, {
                // value signifies the cost of one Gang token which is "0.001" eth.
                // We are parsing `0.001` string to ether using the utils library from ethers.js
                value: utils.parseEther(value.toString()),
            });
            setLoading(true);
            // wait for the transaction to get mined
            await tx.wait();
            setLoading(false);
            window.alert("Sucessfully minted Gang Tokens");
            await getBalanceOfCryptoDevTokens();
            await getTotalTokensMinted();
            await getTokensToBeClaimed();
        } catch (err) {
            alert(err.reason)
        }
    };
    const claimCryptoDevTokens = async () => {
        try {
            // We need a Signer here since this is a 'write' transaction.
            // Create an instance of tokenContract
            const signer = await getProviderOrSigner(true);
            // Create an instance of tokenContract
            const tokenContract = new Contract(
                tokendata.address,
                tokendata.abi,
                signer
            );
            const tx = await tokenContract.claim();
            setLoading(true);
            // wait for the transaction to get mined
            await tx.wait();
            setLoading(false);
            window.alert("Sucessfully claimed Gang Tokens");
            await getBalanceOfCryptoDevTokens();
            await getTotalTokensMinted();
            await getTokensToBeClaimed();
        } catch (err) {
            alert(err.reason)
        }
    };
    const getTotalTokensMinted = async () => {
        try {
            // Get the provider from web3Modal, which in our case is MetaMask
            // No need for the Signer here, as we are only reading state from the blockchain
            const provider = await getProviderOrSigner();
            // Create an instance of token contract
            const tokenContract = new Contract(
                tokendata.address,
                tokendata.abi,
                provider
            );
            // console.log(tokendata.address);
            // Get all the tokens that have been minted
            const _tokensMinted = await tokenContract.totalSupply();
            console.log(parseInt(_tokensMinted));
            setTokensMinted(_tokensMinted);
        } catch (err) {
            alert(err)
        }
    };
    const getOwner = async () => {
        try {
            const provider = await getProviderOrSigner();
            const tokenContract = new Contract(
                tokendata.address,
                tokendata.abi,
                provider
            );
            // call the owner function from the contract
            const _owner = await tokenContract.owner();
            // we get signer to extract address of currently connected Metamask account
            const signer = await getProviderOrSigner(true);
            // Get the address associated to signer which is connected to Metamask
            const address = await signer.getAddress();
            if (address.toLowerCase() === _owner.toLowerCase()) {
                setIsOwner(true);
            }
        } catch (err) {
            alert(err.reason)
        }
    };
    const withdrawCoins = async () => {
        try {
            const signer = await getProviderOrSigner(true);
            const tokenContract = new Contract(
                tokendata.address,
                tokendata.abi,
                signer
            );

            const tx = await tokenContract.withdraw();
            setLoading(true);
            await tx.wait();
            setLoading(false);
            await getOwner();
        } catch (err) {
            console.error(err);
            window.alert(err.reason);
        }
    };


    const getProviderOrSigner = async (needSigner = false) => {
        // Connect to Metamask
        // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
        const provider = await web3ModalRef.current.connect();
        const web3Provider = new providers.Web3Provider(provider);

        // If user is not connected to the Goerli network, let them know and throw an error
        const { chainId } = await web3Provider.getNetwork();
        if (chainId !== 5) {
            window.alert("Change the network to Goerli");
            throw new Error("Change network to Goerli");
        }

        if (needSigner) {
            const signer = web3Provider.getSigner();
            return signer;
        }
        return web3Provider;
    };
    const connectWallet = async () => {
        try {
            // Get the provider from web3Modal, which in our case is MetaMask
            // When used for the first time, it prompts the user to connect their wallet
            await getProviderOrSigner();
            setWalletConnected(true);
        } catch (err) {
            console.error(err);
        }
    };
    useEffect(() => {
        // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
        if (!walletConnected) {
            // Assign the Web3Modal class to the reference object by setting it's `current` value
            // The `current` value is persisted throughout as long as this page is open
            web3ModalRef.current = new Web3Modal({
                network: "goerli",
                providerOptions: {},
                disableInjectedProvider: false,
            });
            connectWallet();
            getTotalTokensMinted();
            getBalanceOfCryptoDevTokens();
            getTokensToBeClaimed();
            getOwner();
        }
    }, [walletConnected]);

    const renderButton = () => {
        // If we are currently waiting for something, return a loading button
        if (loading) {
            return (
                <div>
                    <button className={styles.button}>Loading...</button>
                </div>
            );
        }
        // If tokens to be claimed are greater than 0, Return a claim button
        if (tokensToBeClaimed > 0) {
            return (
                <div>
                    <div className={styles.description}>
                        {tokensToBeClaimed * 10} Tokens can be claimed!
                    </div>
                    <button className={styles.button} onClick={claimCryptoDevTokens}>
                        Claim Tokens
                    </button>
                </div>
            );
        }
        // If user doesn't have any tokens to claim, show the mint button
        return (

            <div style={{ display: "flex-col" }}>
                <div>
                    <input
                        type="number"
                        placeholder="Amount of Tokens"
                        // BigNumber.from converts the `e.target.value` to a BigNumber
                        // onChange={(e) => setTokenAmount(console.log(e.target.value))}
                        onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
                        className={styles.input}
                    />
                </div>
                <button
                    className={styles.button}
                    disabled={!(tokenAmount > 0)}
                    onClick={() => mintCryptoDevToken(tokenAmount)}
                >
                    Mint Tokens
                </button>
            </div>
        );
    };
    return (
        <div>
            <Head>
                <title>Gang Token</title>
                <meta name="description" content="ICO-Dapp" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className={styles.main}>
                <div>
                    <h1 className={styles.title}>Welcome to Gang Token ICO!</h1>
                    <div className={styles.description}>
                        You can claim or mint Gang tokens here
                    </div>
                    {walletConnected ? (
                        <div>
                            <div className={styles.description}>
                                {/* Format Ether helps us in converting a BigNumber to string */}
                                You have minted {utils.formatEther(balanceOfCryptoDevTokens)} Gang Token
                            </div>
                            <div className={styles.description}>
                                {/* Format Ether helps us in converting a BigNumber to string */}
                                Overall {utils.formatEther(tokensMinted)}/10000 have been minted!!!
                            </div>
                            {renderButton()}
                            {/* Display additional withdraw button if connected wallet is owner */}
                            {isOwner ? (
                                <div>
                                    {loading ? <button className={styles.button}>Loading...</button>
                                        : <button className={styles.button} onClick={withdrawCoins}>
                                            Withdraw Coins
                                        </button>
                                    }
                                </div>
                            ) : ("")
                            }
                        </div>
                    ) : (
                        <button onClick={connectWallet} className={styles.button}>
                            Connect your wallet
                        </button>
                    )}
                </div>
                <div>

                </div>
            </div>

            <footer className={styles.footer}>
                Made with &#10084; by Mustakim
            </footer>
        </div>
    );

} 