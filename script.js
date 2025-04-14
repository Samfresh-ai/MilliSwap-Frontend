// Transaction history storage
let transactionHistory = [];
let provider, signer, swapContract, userAddress;
let isWalletConnected = false;

// Swap contract ABI
const SWAP_ABI = [
    "function depositMON() external payable",
    "function depositDAI(uint256 amount) external",
    "function depositUSDT(uint256 amount) external",
    "function depositETH() external payable",
    "function depositBNB(uint256 amount) external",
    "function depositMATIC(uint256 amount) external",
    "function swapMONForDAI(uint256 monAmount) external",
    "function swapMONForUSDT(uint256 monAmount) external",
    "function swapMONForETH(uint256 monAmount) external",
    "function swapMONForBNB(uint256 monAmount) external",
    "function swapMONForMATIC(uint256 monAmount) external",
    "function swapDAIForMON(uint256 daiAmount) external",
    "function swapUSDTForMON(uint256 usdtAmount) external",
    "function swapETHForMON(uint256 ethAmount) external",
    "function swapBNBForMON(uint256 bnbAmount) external",
    "function swapMATICForMON(uint256 maticAmount) external",
    "function getBalances(address user) external view returns (uint256 monBalance, uint256 daiBalance, uint256 usdtBalance, uint256 ethBalance, uint256 bnbBalance, uint256 maticBalance)",
    "event SwapExecuted(address indexed user, string fromToken, string toToken, uint256 fromAmount, uint256 toAmount)"
];

// Swap contract address (replace with your new deployed contract address)
const SWAP_ADDRESS = "0xE8eC3E1af4f3bf4cf8dce01ca1817c4E01bc1385"; // Replace with your actual contract address

// Initialize ethers.js and connect to the contract
async function initializeContract() {
    console.log("Step 1: Attempting to initialize contract...");

    // Check if ethers is loaded
    if (typeof ethers === 'undefined') {
        console.error("Step 2: Ethers.js is not loaded. Please ensure the ethers.js script is included in index.html.");
        alert("Ethers.js library failed to load. Please check your internet connection and refresh the page.");
        return;
    }

    // Check if window.ethereum is available
    if (typeof window.ethereum !== 'undefined') {
        console.log("Step 3: MetaMask detected, attempting to connect...");
        try {
            // Check if MetaMask is locked
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            console.log("Step 4: Current accounts:", accounts);
            if (accounts.length === 0) {
                console.log("Step 5: MetaMask is locked, requesting accounts...");
            }

            // Check the current network
            const network = await window.ethereum.request({ method: 'net_version' });
            console.log("Step 6: Current network ID:", network);
            if (network !== "10143") {
                console.log("Step 7: Network mismatch. Switching to Monad testnet...");
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x27CF' }], // 0x27CF is hex for 10143
                    });
                    console.log("Step 8: Switched to Monad testnet");
                } catch (switchError) {
                    if (switchError.code === 4902) {
                        console.log("Step 9: Monad testnet not found, adding network...");
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: '0x27CF',
                                chainName: 'Monad Testnet',
                                rpcUrls: ['https://testnet-rpc.monad.xyz'],
                                nativeCurrency: {
                                    name: 'Monad',
                                    symbol: 'MON',
                                    decimals: 18
                                },
                                blockExplorerUrls: ['https://testnet.monadexplorer.com/']
                            }],
                        });
                        console.log("Step 10: Added Monad testnet");
                    } else {
                        throw switchError;
                    }
                }
            }

            console.log("Step 11: Creating provider...");
            provider = new ethers.providers.Web3Provider(window.ethereum);
            console.log("Step 12: Provider created:", provider);

            console.log("Step 13: Requesting accounts...");
            await provider.send("eth_requestAccounts", []);
            console.log("Step 14: Accounts requested successfully");

            console.log("Step 15: Getting signer...");
            signer = provider.getSigner();
            userAddress = await signer.getAddress();
            console.log("Step 16: User address:", userAddress);

            console.log("Step 17: Creating contract instance...");
            swapContract = new ethers.Contract(SWAP_ADDRESS, SWAP_ABI, signer);
            console.log("Step 18: Contract instance created:", swapContract);

            // Update UI with user balances
            await updateBalances();
            isWalletConnected = true;
            updateWalletUI();
        } catch (error) {
            console.error("Error in initializeContract:", error);
            throw error;
        }
    } else {
        console.log("Step 19: MetaMask not detected");
        alert("Please install MetaMask to use MilliSwap!");
    }
}

// Update user balances in the UI and console
async function updateBalances() {
    if (!swapContract || !userAddress) return;
    try {
        // Fetch contract balances
        const [monBalance, daiBalance, usdtBalance, ethBalance, bnbBalance, maticBalance] = await swapContract.getBalances(userAddress);

        // Fetch actual MON balance from wallet
        const walletMonBalance = await provider.getBalance(userAddress);

        // Log balances to console
        console.log(`Wallet MON Balance: ${ethers.utils.formatEther(walletMonBalance)} MON`);
        console.log(`Contract MON Balance: ${ethers.utils.formatEther(monBalance)} MON`);
        console.log(`DAI Balance: ${ethers.utils.formatUnits(daiBalance, 18)} DAI`);
        console.log(`USDT Balance: ${ethers.utils.formatUnits(usdtBalance, 18)} USDT`);
        console.log(`ETH Balance: ${ethers.utils.formatEther(ethBalance)} ETH`);
        console.log(`BNB Balance: ${ethers.utils.formatUnits(bnbBalance, 18)} BNB`);
        console.log(`MATIC Balance: ${ethers.utils.formatUnits(maticBalance, 18)} MATIC`);

        // Update header balances (use walletMonBalance for MON)
        const monBalanceElement = document.getElementById('mon-balance');
        const daiBalanceElement = document.getElementById('dai-balance');
        const usdtBalanceElement = document.getElementById('usdt-balance');
        const ethBalanceElement = document.getElementById('eth-balance');
        const bnbBalanceElement = document.getElementById('bnb-balance');
        const maticBalanceElement = document.getElementById('matic-balance');

        if (monBalanceElement) monBalanceElement.textContent = ethers.utils.formatEther(walletMonBalance);
        if (daiBalanceElement) daiBalanceElement.textContent = ethers.utils.formatUnits(daiBalance, 18);
        if (usdtBalanceElement) usdtBalanceElement.textContent = ethers.utils.formatUnits(usdtBalance, 18);
        if (ethBalanceElement) ethBalanceElement.textContent = ethers.utils.formatEther(ethBalance);
        if (bnbBalanceElement) bnbBalanceElement.textContent = ethers.utils.formatUnits(bnbBalance, 18);
        if (maticBalanceElement) maticBalanceElement.textContent = ethers.utils.formatUnits(maticBalance, 18);

        // Update token dropdowns with balances
        const balances = {
            mon: ethers.utils.formatEther(walletMonBalance),
            dai: ethers.utils.formatUnits(daiBalance, 18),
            usdt: ethers.utils.formatUnits(usdtBalance, 18),
            eth: ethers.utils.formatEther(ethBalance),
            bnb: ethers.utils.formatUnits(bnbBalance, 18),
            matic: ethers.utils.formatUnits(maticBalance, 18)
        };

        ['from-token', 'to-token'].forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                ['mon', 'dai', 'usdt', 'eth', 'bnb', 'matic'].forEach(token => {
                    const option = select.querySelector(`option[value="${token}"]`);
                    if (option) {
                        option.textContent = `${token.toUpperCase()} (${parseFloat(balances[token]).toFixed(2)})`;
                    }
                });
            }
        });

        // Update swap section balances
        updateSwapBalances();
    } catch (error) {
        console.error("Error fetching balances:", error);
    }
}

// Update balances in the swap section based on selected tokens
function updateSwapBalances() {
    if (!swapContract || !userAddress) return;

    const fromToken = document.getElementById('from-token')?.value;
    const toToken = document.getElementById('to-token')?.value;

    Promise.all([
        provider.getBalance(userAddress), // Fetch wallet MON balance
        swapContract.getBalances(userAddress) // Fetch contract balances
    ]).then(([walletMonBalance, [monBalance, daiBalance, usdtBalance, ethBalance, bnbBalance, maticBalance]]) => {
        const balances = {
            mon: ethers.utils.formatEther(walletMonBalance),
            dai: ethers.utils.formatUnits(daiBalance, 18),
            usdt: ethers.utils.formatUnits(usdtBalance, 18),
            eth: ethers.utils.formatEther(ethBalance),
            bnb: ethers.utils.formatUnits(bnbBalance, 18),
            matic: ethers.utils.formatUnits(maticBalance, 18)
        };

        // Update "From" balance
        const fromBalanceElement = document.getElementById('from-balance');
        if (fromBalanceElement) {
            fromBalanceElement.textContent = fromToken ? balances[fromToken] || '0' : '0';
        }

        // Update "To" balance
        const toBalanceElement = document.getElementById('to-balance');
        if (toBalanceElement) {
            toBalanceElement.textContent = toToken ? balances[toToken] || '0' : '0';
        }

        // Update estimated amount if "From" amount is entered
        updateEstimatedAmount();
    }).catch(error => {
        console.error("Error updating swap balances:", error);
    });
}

// Update estimated "To" amount based on "From" amount
function updateEstimatedAmount() {
    const fromAmount = document.getElementById('from-amount')?.value;
    const fromToken = document.getElementById('from-token')?.value;
    const toToken = document.getElementById('to-token')?.value;
    const toAmountField = document.getElementById('to-amount');

    if (!toAmountField || !fromAmount || isNaN(fromAmount) || !fromToken || !toToken || fromToken === toToken) {
        if (toAmountField) toAmountField.value = '';
        return;
    }

    const amount = parseFloat(fromAmount);
    const rates = {
        mon: {
            dai: 2500,
            usdt: 2500,
            eth: 1,
            bnb: 5,
            matic: 1000
        }
    };

    let toAmount;
    if (fromToken === 'mon' && rates.mon[toToken]) {
        toAmount = amount * rates.mon[toToken];
    } else if (toToken === 'mon' && rates.mon[fromToken]) {
        toAmount = amount / rates.mon[fromToken];
    } else {
        toAmountField.value = '';
        return;
    }

    toAmountField.value = toAmount.toFixed(4);
}

// Update wallet UI (show/hide dropdown)
function updateWalletUI() {
    const connectButton = document.getElementById('connect-wallet');
    const walletDropdown = document.getElementById('wallet-dropdown');

    if (!connectButton || !walletDropdown) {
        console.error("Required DOM elements not found: connectButton or walletDropdown");
        return;
    }

    if (isWalletConnected) {
        connectButton.textContent = 'Wallet Connected';
    } else {
        connectButton.textContent = 'Connect Wallet';
        walletDropdown.classList.remove('active');
        const balanceElements = [
            'mon-balance', 'dai-balance', 'usdt-balance',
            'eth-balance', 'bnb-balance', 'matic-balance',
            'from-balance', 'to-balance'
        ];
        balanceElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = '0';
        });
        ['from-token', 'to-token'].forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                ['mon', 'dai', 'usdt', 'eth', 'bnb', 'matic'].forEach(token => {
                    const option = select.querySelector(`option[value="${token}"]`);
                    if (option) option.textContent = `${token.toUpperCase()} (0)`;
                });
            }
        });
    }
}

// Disconnect wallet
function disconnectWallet() {
    provider = null;
    signer = null;
    swapContract = null;
    userAddress = null;
    isWalletConnected = false;
    updateWalletUI();
}

// Function to display transaction history
function displayTransactionHistory() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;

    historyList.innerHTML = '';
    if (transactionHistory.length === 0) {
        historyList.innerHTML = '<p>No transactions yet.</p>';
        return;
    }

    transactionHistory.forEach(tx => {
        const txElement = document.createElement('p');
        txElement.textContent = `Swapped ${tx.fromAmount} ${tx.fromToken.toUpperCase()} for ${tx.toAmount} ${tx.toToken.toUpperCase()} on ${tx.date}`;
        historyList.appendChild(txElement);
    });
}

// Function to show the history pop-up
function showHistory() {
    const historySection = document.getElementById('history');
    if (!historySection) return;

    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    historySection.classList.add('active');
    displayTransactionHistory();
}

// Function to hide the history pop-up
function hideHistory() {
    const historySection = document.getElementById('history');
    if (!historySection) return;

    historySection.classList.remove('active');
    const activeTab = document.querySelector('.tab-button.active') || document.querySelector('.tab-button[data-tab="swap"]');
    if (activeTab) {
        activeTab.classList.add('active');
        document.getElementById(activeTab.getAttribute('data-tab')).classList.add('active');
    }
}

// Initialize event listeners after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Tab switching logic
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            const historySection = document.getElementById('history');
            if (historySection) historySection.classList.remove('active');

            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Event listener for the Connect Wallet button
    const connectWalletButton = document.getElementById('connect-wallet');
    if (connectWalletButton) {
        connectWalletButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            const walletDropdown = document.getElementById('wallet-dropdown');
            if (!walletDropdown) {
                console.error("wallet-dropdown element not found");
                return;
            }

            if (isWalletConnected) {
                // Toggle dropdown visibility
                walletDropdown.classList.toggle('active');
            } else {
                try {
                    await initializeContract();
                    // Deposit some initial balances for testing (excluding MON since we're using wallet balance)
                    await swapContract.depositDAI(ethers.utils.parseUnits("2500", 18));
                    await swapContract.depositUSDT(ethers.utils.parseUnits("2500", 18));
                    await swapContract.depositETH({ value: ethers.utils.parseEther("1") });
                    await swapContract.depositBNB(ethers.utils.parseUnits("5", 18));
                    await swapContract.depositMATIC(ethers.utils.parseUnits("1000", 18));
                    await updateBalances();
                    walletDropdown.classList.add('active');
                } catch (error) {
                    console.error('Error connecting wallet:', error);
                    alert('Failed to connect wallet. Please check the console for details.');
                }
            }
        });
    }

    // Close wallet dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const walletDropdown = document.getElementById('wallet-dropdown');
        const connectButton = document.getElementById('connect-wallet');
        if (walletDropdown && connectButton && !connectButton.contains(e.target) && !walletDropdown.contains(e.target)) {
            walletDropdown.classList.remove('active');
        }
    });

    // Event listener for the Disconnect Wallet button
    const disconnectWalletButton = document.getElementById('disconnect-wallet');
    if (disconnectWalletButton) {
        disconnectWalletButton.addEventListener('click', () => {
            disconnectWallet();
        });
    }

    // Event listener for the History button
    const historyButton = document.getElementById('history-button');
    if (historyButton) {
        historyButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const historySection = document.getElementById('history');
            if (!historySection) return;

            const isVisible = historySection.classList.contains('active');
            if (!isVisible) {
                showHistory();
            } else {
                hideHistory();
            }
        });
    }

    // Event listener to close history when clicking outside
    document.addEventListener('click', (e) => {
        const historySection = document.getElementById('history');
        const historyBox = document.querySelector('.history-box');
        const historyButton = document.getElementById('history-button');

        if (historySection && historySection.classList.contains('active') && 
            historyBox && !historyBox.contains(e.target) && 
            historyButton && e.target !== historyButton) {
            hideHistory();
        }
    });

    // Event listener for token selection to update balances
    const fromTokenSelect = document.getElementById('from-token');
    const toTokenSelect = document.getElementById('to-token');
    if (fromTokenSelect) {
        fromTokenSelect.addEventListener('change', () => {
            updateSwapBalances();
            updateEstimatedAmount();
        });
    }
    if (toTokenSelect) {
        toTokenSelect.addEventListener('change', () => {
            updateSwapBalances();
            updateEstimatedAmount();
        });
    }

    // Event listener for "From" amount input to update estimated amount
    const fromAmountInput = document.getElementById('from-amount');
    if (fromAmountInput) {
        fromAmountInput.addEventListener('input', updateEstimatedAmount);
    }

    // Event listener for the arrow icon to swap "From" and "To" sections
    const arrowIcon = document.querySelector('.arrow-icon');
    if (arrowIcon) {
        arrowIcon.addEventListener('click', () => {
            const fromAmount = document.getElementById('from-amount');
            const toAmount = document.getElementById('to-amount');
            const fromToken = document.getElementById('from-token');
            const toToken = document.getElementById('to-token');

            if (fromAmount && toAmount && fromToken && toToken) {
                const tempAmount = fromAmount.value;
                fromAmount.value = toAmount.value;
                toAmount.value = tempAmount;

                const tempToken = fromToken.value;
                fromToken.value = toToken.value;
                toToken.value = tempToken;

                const output = document.getElementById('output');
                if (output) output.textContent = 'Result will appear here';
                updateSwapBalances();
                updateEstimatedAmount();
            }
        });
    }

    // Event listener for the Swap button
    const swapButton = document.getElementById('swap-button');
    if (swapButton) {
        swapButton.addEventListener('click', async () => {
            const fromAmount = document.getElementById('from-amount')?.value;
            const fromToken = document.getElementById('from-token')?.value;
            const toToken = document.getElementById('to-token')?.value;
            const toAmountField = document.getElementById('to-amount');
            const output = document.getElementById('output');

            if (!fromAmount || !fromToken || !toToken || !toAmountField || !output) {
                if (output) output.textContent = 'Missing required fields';
                return;
            }

            // Validate input
            if (isNaN(fromAmount) || parseFloat(fromAmount) <= 0) {
                output.textContent = 'Please enter a valid amount';
                toAmountField.value = '';
                return;
            }

            if (!fromToken || !toToken) {
                output.textContent = 'Please select a token for both From and To';
                toAmountField.value = '';
                return;
            }

            if (fromToken === toToken) {
                output.textContent = 'Please select different tokens for From and To';
                toAmountField.value = '';
                return;
            }

            if (!swapContract || !userAddress) {
                output.textContent = 'Please connect your wallet first';
                toAmountField.value = '';
                return;
            }

            try {
                const amount = parseFloat(fromAmount);
                let tx, toAmount;

                // Swap rates (matching the contract)
                const rates = {
                    mon: {
                        dai: 2500,
                        usdt: 2500,
                        eth: 1,
                        bnb: 5,
                        matic: 1000
                    }
                };

                // Prepare transaction data for MetaMask
                let method, args, description;
                if (fromToken === 'mon') {
                    const monAmount = ethers.utils.parseEther(fromAmount);
                    if (toToken === 'dai') {
                        method = 'swapMONForDAI';
                        args = [monAmount];
                        toAmount = amount * rates.mon.dai;
                        description = `Swap ${amount} MON for ${toAmount.toFixed(4)} DAI`;
                    } else if (toToken === 'usdt') {
                        method = 'swapMONForUSDT';
                        args = [monAmount];
                        toAmount = amount * rates.mon.usdt;
                        description = `Swap ${amount} MON for ${toAmount.toFixed(4)} USDT`;
                    } else if (toToken === 'eth') {
                        method = 'swapMONForETH';
                        args = [monAmount];
                        toAmount = amount * rates.mon.eth;
                        description = `Swap ${amount} MON for ${toAmount.toFixed(4)} ETH`;
                    } else if (toToken === 'bnb') {
                        method = 'swapMONForBNB';
                        args = [monAmount];
                        toAmount = amount * rates.mon.bnb;
                        description = `Swap ${amount} MON for ${toAmount.toFixed(4)} BNB`;
                    } else if (toToken === 'matic') {
                        method = 'swapMONForMATIC';
                        args = [monAmount];
                        toAmount = amount * rates.mon.matic;
                        description = `Swap ${amount} MON for ${toAmount.toFixed(4)} MATIC`;
                    } else {
                        output.textContent = 'Unsupported token pair';
                        toAmountField.value = '';
                        return;
                    }
                } else if (toToken === 'mon') {
                    if (fromToken === 'dai') {
                        const daiAmount = ethers.utils.parseUnits(fromAmount, 18);
                        method = 'swapDAIForMON';
                        args = [daiAmount];
                        toAmount = amount / rates.mon.dai;
                        description = `Swap ${amount} DAI for ${toAmount.toFixed(4)} MON`;
                    } else if (fromToken === 'usdt') {
                        const usdtAmount = ethers.utils.parseUnits(fromAmount, 18);
                        method = 'swapUSDTForMON';
                        args = [usdtAmount];
                        toAmount = amount / rates.mon.usdt;
                        description = `Swap ${amount} USDT for ${toAmount.toFixed(4)} MON`;
                    } else if (fromToken === 'eth') {
                        const ethAmount = ethers.utils.parseEther(fromAmount);
                        method = 'swapETHForMON';
                        args = [ethAmount];
                        toAmount = amount / rates.mon.eth;
                        description = `Swap ${amount} ETH for ${toAmount.toFixed(4)} MON`;
                    } else if (fromToken === 'bnb') {
                        const bnbAmount = ethers.utils.parseUnits(fromAmount, 18);
                        method = 'swapBNBForMON';
                        args = [bnbAmount];
                        toAmount = amount / rates.mon.bnb;
                        description = `Swap ${amount} BNB for ${toAmount.toFixed(4)} MON`;
                    } else if (fromToken === 'matic') {
                        const maticAmount = ethers.utils.parseUnits(fromAmount, 18);
                        method = 'swapMATICForMON';
                        args = [maticAmount];
                        toAmount = amount / rates.mon.matic;
                        description = `Swap ${amount} MATIC for ${toAmount.toFixed(4)} MON`;
                    } else {
                        output.textContent = 'Unsupported token pair';
                        toAmountField.value = '';
                        return;
                    }
                } else {
                    output.textContent = 'Unsupported token pair. Please swap with MON as one of the tokens.';
                    toAmountField.value = '';
                    return;
                }

                // Encode transaction data with a custom message for MetaMask
                const data = swapContract.interface.encodeFunctionData(method, args);
                const transactionParameters = {
                    to: SWAP_ADDRESS,
                    from: userAddress,
                    data: data,
                    // Add a custom message for MetaMask (not all versions of MetaMask display this, but it's worth including)
                    customData: {
                        description: description
                    }
                };

                // Send transaction via MetaMask
                const txHash = await window.ethereum.request({
                    method: 'eth_sendTransaction',
                    params: [transactionParameters],
                });

                // Wait for the transaction to be mined
                const receipt = await provider.waitForTransaction(txHash);
                if (receipt.status === 1) {
                    console.log('Transaction successful:', receipt);
                } else {
                    throw new Error('Transaction failed');
                }

                // Update the UI
                toAmountField.value = toAmount.toFixed(4);
                output.textContent = `You get ${toAmount.toFixed(4)} ${toToken.toUpperCase()}`;

                // Add the transaction to history
                transactionHistory.push({
                    fromAmount: amount,
                    fromToken: fromToken,
                    toAmount: toAmount.toFixed(4),
                    toToken: toToken,
                    date: new Date().toLocaleString()
                });

                // Update balances
                await updateBalances();
            } catch (error) {
                console.error('Error performing swap:', error);
                output.textContent = 'Swap failed. Check the console for details.';
                toAmountField.value = '';
            }
        });
    }
});
