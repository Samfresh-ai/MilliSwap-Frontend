// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract Swap {
    mapping(address => uint256) public monBalances;
    mapping(address => uint256) public daiBalances;
    mapping(address => uint256) public usdtBalances;
    mapping(address => uint256) public ethBalances;
    mapping(address => uint256) public bnbBalances;
    mapping(address => uint256) public maticBalances;

    // Fixed swap rates (for simplicity)
    uint256 public constant MON_TO_DAI_RATE = 2500;   // 1 MON = 2500 DAI
    uint256 public constant MON_TO_USDT_RATE = 2500;  // 1 MON = 2500 USDT
    uint256 public constant MON_TO_ETH_RATE = 1;      // 1 MON = 1 ETH
    uint256 public constant MON_TO_BNB_RATE = 5;      // 1 MON = 5 BNB
    uint256 public constant MON_TO_MATIC_RATE = 1000; // 1 MON = 1000 MATIC

    event SwapExecuted(address indexed user, string fromToken, string toToken, uint256 fromAmount, uint256 toAmount);

    // Deposit functions
    function depositMON() external payable {
        monBalances[msg.sender] += msg.value;
    }

    function depositDAI(uint256 amount) external {
        daiBalances[msg.sender] += amount;
    }

    function depositUSDT(uint256 amount) external {
        usdtBalances[msg.sender] += amount;
    }

    function depositETH() external payable {
        ethBalances[msg.sender] += msg.value;
    }

    function depositBNB(uint256 amount) external {
        bnbBalances[msg.sender] += amount;
    }

    function depositMATIC(uint256 amount) external {
        maticBalances[msg.sender] += amount;
    }

    // Swap functions (MON to other tokens)
    function swapMONForDAI(uint256 monAmount) external {
        require(monBalances[msg.sender] >= monAmount, "Insufficient MON balance");
        uint256 daiAmount = monAmount * MON_TO_DAI_RATE;

        monBalances[msg.sender] -= monAmount;
        daiBalances[msg.sender] += daiAmount;

        emit SwapExecuted(msg.sender, "MON", "DAI", monAmount, daiAmount);
    }

    function swapMONForUSDT(uint256 monAmount) external {
        require(monBalances[msg.sender] >= monAmount, "Insufficient MON balance");
        uint256 usdtAmount = monAmount * MON_TO_USDT_RATE;

        monBalances[msg.sender] -= monAmount;
        usdtBalances[msg.sender] += usdtAmount;

        emit SwapExecuted(msg.sender, "MON", "USDT", monAmount, usdtAmount);
    }

    function swapMONForETH(uint256 monAmount) external {
        require(monBalances[msg.sender] >= monAmount, "Insufficient MON balance");
        uint256 ethAmount = monAmount * MON_TO_ETH_RATE;

        monBalances[msg.sender] -= monAmount;
        ethBalances[msg.sender] += ethAmount;

        emit SwapExecuted(msg.sender, "MON", "ETH", monAmount, ethAmount);
    }

    function swapMONForBNB(uint256 monAmount) external {
        require(monBalances[msg.sender] >= monAmount, "Insufficient MON balance");
        uint256 bnbAmount = monAmount * MON_TO_BNB_RATE;

        monBalances[msg.sender] -= monAmount;
        bnbBalances[msg.sender] += bnbAmount;

        emit SwapExecuted(msg.sender, "MON", "BNB", monAmount, bnbAmount);
    }

    function swapMONForMATIC(uint256 monAmount) external {
        require(monBalances[msg.sender] >= monAmount, "Insufficient MON balance");
        uint256 maticAmount = monAmount * MON_TO_MATIC_RATE;

        monBalances[msg.sender] -= monAmount;
        maticBalances[msg.sender] += maticAmount;

        emit SwapExecuted(msg.sender, "MON", "MATIC", monAmount, maticAmount);
    }

    // Swap functions (other tokens to MON)
    function swapDAIForMON(uint256 daiAmount) external {
        require(daiBalances[msg.sender] >= daiAmount, "Insufficient DAI balance");
        uint256 monAmount = daiAmount / MON_TO_DAI_RATE;

        daiBalances[msg.sender] -= daiAmount;
        monBalances[msg.sender] += monAmount;

        emit SwapExecuted(msg.sender, "DAI", "MON", daiAmount, monAmount);
    }

    function swapUSDTForMON(uint256 usdtAmount) external {
        require(usdtBalances[msg.sender] >= usdtAmount, "Insufficient USDT balance");
        uint256 monAmount = usdtAmount / MON_TO_USDT_RATE;

        usdtBalances[msg.sender] -= usdtAmount;
        monBalances[msg.sender] += monAmount;

        emit SwapExecuted(msg.sender, "USDT", "MON", usdtAmount, monAmount);
    }

    function swapETHForMON(uint256 ethAmount) external {
        require(ethBalances[msg.sender] >= ethAmount, "Insufficient ETH balance");
        uint256 monAmount = ethAmount / MON_TO_ETH_RATE;

        ethBalances[msg.sender] -= ethAmount;
        monBalances[msg.sender] += monAmount;

        emit SwapExecuted(msg.sender, "ETH", "MON", ethAmount, monAmount);
    }

    function swapBNBForMON(uint256 bnbAmount) external {
        require(bnbBalances[msg.sender] >= bnbAmount, "Insufficient BNB balance");
        uint256 monAmount = bnbAmount / MON_TO_BNB_RATE;

        bnbBalances[msg.sender] -= bnbAmount;
        monBalances[msg.sender] += monAmount;

        emit SwapExecuted(msg.sender, "BNB", "MON", bnbAmount, monAmount);
    }

    function swapMATICForMON(uint256 maticAmount) external {
        require(maticBalances[msg.sender] >= maticAmount, "Insufficient MATIC balance");
        uint256 monAmount = maticAmount / MON_TO_MATIC_RATE;

        maticBalances[msg.sender] -= maticAmount;
        monBalances[msg.sender] += monAmount;

        emit SwapExecuted(msg.sender, "MATIC", "MON", maticAmount, monAmount);
    }

    // Get balances for all tokens
    function getBalances(address user) external view returns (
        uint256 monBalance,
        uint256 daiBalance,
        uint256 usdtBalance,
        uint256 ethBalance,
        uint256 bnbBalance,
        uint256 maticBalance
    ) {
        return (
            monBalances[user],
            daiBalances[user],
            usdtBalances[user],
            ethBalances[user],
            bnbBalances[user],
            maticBalances[user]
        );
    }
}
