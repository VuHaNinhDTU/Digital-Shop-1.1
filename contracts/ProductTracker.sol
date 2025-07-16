// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ProductTracker
 * @dev Smart contract for agricultural product traceability and supply chain management
 * @author Cho Nong San So Team
 */
contract ProductTracker {
    
    // ========================================
    // DATA STRUCTURES
    // ========================================
    
    struct Product {
        uint256 id;
        string name;
        string category;
        string description;
        uint256 price;
        string unit;
        address farmer;
        uint256 createdAt;
        uint256 updatedAt;
        bool isActive;
        string[] imageHashes;  // IPFS hashes for images
        QualityInfo quality;
    }
    
    struct QualityInfo {
        bool isOrganic;
        string certificationNumber;
        uint256 expiryDate;
        string origin;  // Nơi sản xuất
        string harvestDate;
        uint8 qualityScore;  // 1-10
    }
    
    struct SupplyChainStep {
        uint256 stepId;
        string stepType;  // "PRODUCTION", "PROCESSING", "TRANSPORT", "DISTRIBUTION"
        string location;
        string description;
        address actor;
        uint256 timestamp;
        string gpsCoordinates;
        string additionalData;  // JSON string for extra info
    }
    
    struct Order {
        uint256 id;
        uint256[] productIds;
        uint256[] quantities;
        address customer;
        string customerName;
        string customerPhone;
        string deliveryAddress;
        uint256 totalAmount;
        uint256 orderDate;
        OrderStatus status;
        string paymentMethod;
        DeliveryInfo delivery;
    }
    
    struct DeliveryInfo {
        address logisticsProvider;
        string trackingId;
        string vehicleId;
        string driverName;
        uint256 estimatedDelivery;
        uint256 actualDelivery;
        string[] checkpoints;  // GPS coordinates during delivery
    }
    
    enum OrderStatus {
        PENDING,
        CONFIRMED,
        PREPARING,
        IN_TRANSIT,
        DELIVERED,
        CANCELLED
    }
    
    // ========================================
    // STATE VARIABLES
    // ========================================
    
    address public owner;
    uint256 public productCounter;
    uint256 public orderCounter;
    uint256 public supplyChainCounter;
    
    // Mappings
    mapping(uint256 => Product) public products;
    mapping(uint256 => Order) public orders;
    mapping(uint256 => SupplyChainStep[]) public productSupplyChain;
    mapping(uint256 => SupplyChainStep[]) public orderSupplyChain;
    mapping(address => bool) public authorizedFarmers;
    mapping(address => bool) public authorizedLogistics;
    mapping(address => bool) public authorizedInspectors;
    
    // Arrays for iteration
    uint256[] public productIds;
    uint256[] public orderIds;
    
    // ========================================
    // EVENTS
    // ========================================
    
    event ProductCreated(
        uint256 indexed productId,
        string name,
        address indexed farmer,
        uint256 timestamp
    );
    
    event ProductUpdated(
        uint256 indexed productId,
        address indexed updatedBy,
        uint256 timestamp
    );
    
    event SupplyChainStepAdded(
        uint256 indexed productId,
        uint256 indexed stepId,
        string stepType,
        address indexed actor,
        uint256 timestamp
    );
    
    event OrderCreated(
        uint256 indexed orderId,
        address indexed customer,
        uint256 totalAmount,
        uint256 timestamp
    );
    
    event OrderStatusUpdated(
        uint256 indexed orderId,
        OrderStatus newStatus,
        address indexed updatedBy,
        uint256 timestamp
    );
    
    event QualityInspectionCompleted(
        uint256 indexed productId,
        uint8 qualityScore,
        address indexed inspector,
        uint256 timestamp
    );
    
    // ========================================
    // MODIFIERS
    // ========================================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyFarmer() {
        require(authorizedFarmers[msg.sender] || msg.sender == owner, 
                "Only authorized farmers can call this function");
        _;
    }
    
    modifier onlyLogistics() {
        require(authorizedLogistics[msg.sender] || msg.sender == owner, 
                "Only authorized logistics providers can call this function");
        _;
    }
    
    modifier onlyInspector() {
        require(authorizedInspectors[msg.sender] || msg.sender == owner, 
                "Only authorized inspectors can call this function");
        _;
    }
    
    modifier productExists(uint256 _productId) {
        require(products[_productId].id != 0, "Product does not exist");
        _;
    }
    
    modifier orderExists(uint256 _orderId) {
        require(orders[_orderId].id != 0, "Order does not exist");
        _;
    }
    
    // ========================================
    // CONSTRUCTOR
    // ========================================
    
    constructor() {
        owner = msg.sender;
        productCounter = 0;
        orderCounter = 0;
        supplyChainCounter = 0;
        
        // Owner is authorized for all roles
        authorizedFarmers[owner] = true;
        authorizedLogistics[owner] = true;
        authorizedInspectors[owner] = true;
    }
    
    // ========================================
    // PRODUCT MANAGEMENT FUNCTIONS
    // ========================================
    
    /**
     * @dev Create a new agricultural product
     */
    function createProduct(
        string memory _name,
        string memory _category,
        string memory _description,
        uint256 _price,
        string memory _unit,
        string[] memory _imageHashes,
        bool _isOrganic,
        string memory _certificationNumber,
        uint256 _expiryDate,
        string memory _origin,
        string memory _harvestDate
    ) external onlyFarmer returns (uint256) {
        
        productCounter++;
        uint256 newProductId = productCounter;
        
        QualityInfo memory quality = QualityInfo({
            isOrganic: _isOrganic,
            certificationNumber: _certificationNumber,
            expiryDate: _expiryDate,
            origin: _origin,
            harvestDate: _harvestDate,
            qualityScore: 0  // Will be set by inspector
        });
        
        Product memory newProduct = Product({
            id: newProductId,
            name: _name,
            category: _category,
            description: _description,
            price: _price,
            unit: _unit,
            farmer: msg.sender,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            isActive: true,
            imageHashes: _imageHashes,
            quality: quality
        });
        
        products[newProductId] = newProduct;
        productIds.push(newProductId);
        
        // Add initial supply chain step - PRODUCTION
        addSupplyChainStep(
            newProductId,
            "PRODUCTION",
            _origin,
            string(abi.encodePacked("Product created: ", _name)),
            "",
            string(abi.encodePacked('{"harvestDate":"', _harvestDate, '","farmer":"', 
                   addressToString(msg.sender), '"}'))
        );
        
        emit ProductCreated(newProductId, _name, msg.sender, block.timestamp);
        
        return newProductId;
    }
    
    /**
     * @dev Update product information
     */
    function updateProduct(
        uint256 _productId,
        string memory _name,
        string memory _description,
        uint256 _price,
        bool _isActive
    ) external productExists(_productId) {
        
        Product storage product = products[_productId];
        require(product.farmer == msg.sender || msg.sender == owner, 
                "Only product owner can update");
        
        product.name = _name;
        product.description = _description;
        product.price = _price;
        product.isActive = _isActive;
        product.updatedAt = block.timestamp;
        
        emit ProductUpdated(_productId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Add supply chain step for a product
     */
    function addSupplyChainStep(
        uint256 _productId,
        string memory _stepType,
        string memory _location,
        string memory _description,
        string memory _gpsCoordinates,
        string memory _additionalData
    ) public productExists(_productId) {
        
        supplyChainCounter++;
        
        SupplyChainStep memory newStep = SupplyChainStep({
            stepId: supplyChainCounter,
            stepType: _stepType,
            location: _location,
            description: _description,
            actor: msg.sender,
            timestamp: block.timestamp,
            gpsCoordinates: _gpsCoordinates,
            additionalData: _additionalData
        });
        
        productSupplyChain[_productId].push(newStep);
        
        emit SupplyChainStepAdded(_productId, supplyChainCounter, 
                                 _stepType, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Quality inspection by authorized inspector
     */
    function inspectProduct(
        uint256 _productId,
        uint8 _qualityScore,
        string memory _inspectionNotes
    ) external onlyInspector productExists(_productId) {
        
        require(_qualityScore >= 1 && _qualityScore <= 10, 
                "Quality score must be between 1 and 10");
        
        Product storage product = products[_productId];
        product.quality.qualityScore = _qualityScore;
        product.updatedAt = block.timestamp;
        
        // Add inspection to supply chain
        addSupplyChainStep(
            _productId,
            "INSPECTION",
            "Quality Control Center",
            string(abi.encodePacked("Quality inspection completed. Score: ", 
                   uint2str(_qualityScore), "/10")),
            "",
            string(abi.encodePacked('{"qualityScore":', uint2str(_qualityScore), 
                   ',"inspector":"', addressToString(msg.sender), 
                   '","notes":"', _inspectionNotes, '"}'))
        );
        
        emit QualityInspectionCompleted(_productId, _qualityScore, 
                                       msg.sender, block.timestamp);
    }
    
    // ========================================
    // ORDER MANAGEMENT FUNCTIONS
    // ========================================
    
    /**
     * @dev Create a new order
     */
    function createOrder(
        uint256[] memory _productIds,
        uint256[] memory _quantities,
        string memory _customerName,
        string memory _customerPhone,
        string memory _deliveryAddress,
        uint256 _totalAmount,
        string memory _paymentMethod
    ) external returns (uint256) {
        
        require(_productIds.length == _quantities.length, 
                "Product IDs and quantities length mismatch");
        require(_productIds.length > 0, "Order must contain at least one product");
        
        // Validate all products exist and are active
        for (uint256 i = 0; i < _productIds.length; i++) {
            require(products[_productIds[i]].id != 0, "Product does not exist");
            require(products[_productIds[i]].isActive, "Product is not active");
            require(_quantities[i] > 0, "Quantity must be greater than 0");
        }
        
        orderCounter++;
        uint256 newOrderId = orderCounter;
        
        DeliveryInfo memory delivery = DeliveryInfo({
            logisticsProvider: address(0),
            trackingId: "",
            vehicleId: "",
            driverName: "",
            estimatedDelivery: 0,
            actualDelivery: 0,
            checkpoints: new string[](0)
        });
        
        Order memory newOrder = Order({
            id: newOrderId,
            productIds: _productIds,
            quantities: _quantities,
            customer: msg.sender,
            customerName: _customerName,
            customerPhone: _customerPhone,
            deliveryAddress: _deliveryAddress,
            totalAmount: _totalAmount,
            orderDate: block.timestamp,
            status: OrderStatus.PENDING,
            paymentMethod: _paymentMethod,
            delivery: delivery
        });
        
        orders[newOrderId] = newOrder;
        orderIds.push(newOrderId);
        
        // Add initial order tracking step
        addOrderTrackingStep(
            newOrderId,
            "ORDER_CREATED",
            "System",
            "Order created and pending confirmation",
            "",
            string(abi.encodePacked('{"customer":"', _customerName, 
                   '","totalAmount":', uint2str(_totalAmount), 
                   ',"paymentMethod":"', _paymentMethod, '"}'))
        );
        
        emit OrderCreated(newOrderId, msg.sender, _totalAmount, block.timestamp);
        
        return newOrderId;
    }
    
    /**
     * @dev Update order status
     */
    function updateOrderStatus(
        uint256 _orderId,
        OrderStatus _newStatus,
        string memory _notes
    ) external orderExists(_orderId) {
        
        Order storage order = orders[_orderId];
        
        // Check permissions based on status
        if (_newStatus == OrderStatus.CONFIRMED || _newStatus == OrderStatus.CANCELLED) {
            require(msg.sender == owner || authorizedFarmers[msg.sender], 
                    "Only farmers can confirm/cancel orders");
        } else if (_newStatus == OrderStatus.IN_TRANSIT || _newStatus == OrderStatus.DELIVERED) {
            require(msg.sender == owner || authorizedLogistics[msg.sender], 
                    "Only logistics providers can update delivery status");
        }
        
        OrderStatus oldStatus = order.status;
        order.status = _newStatus;
        
        // Add tracking step
        string memory stepType = getStatusString(_newStatus);
        addOrderTrackingStep(
            _orderId,
            stepType,
            "System",
            _notes,
            "",
            string(abi.encodePacked('{"previousStatus":"', getStatusString(oldStatus), 
                   '","newStatus":"', getStatusString(_newStatus), 
                   '","updatedBy":"', addressToString(msg.sender), '"}'))
        );
        
        emit OrderStatusUpdated(_orderId, _newStatus, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Assign logistics provider to order
     */
    function assignLogistics(
        uint256 _orderId,
        address _logisticsProvider,
        string memory _trackingId,
        string memory _vehicleId,
        string memory _driverName,
        uint256 _estimatedDelivery
    ) external onlyLogistics orderExists(_orderId) {
        
        Order storage order = orders[_orderId];
        require(order.status == OrderStatus.CONFIRMED || order.status == OrderStatus.PREPARING, 
                "Order must be confirmed to assign logistics");
        
        order.delivery.logisticsProvider = _logisticsProvider;
        order.delivery.trackingId = _trackingId;
        order.delivery.vehicleId = _vehicleId;
        order.delivery.driverName = _driverName;
        order.delivery.estimatedDelivery = _estimatedDelivery;
        
        // Add tracking step
        addOrderTrackingStep(
            _orderId,
            "LOGISTICS_ASSIGNED",
            "Logistics Center",
            string(abi.encodePacked("Logistics assigned. Tracking ID: ", _trackingId)),
            "",
            string(abi.encodePacked('{"logisticsProvider":"', addressToString(_logisticsProvider), 
                   '","trackingId":"', _trackingId, 
                   '","vehicleId":"', _vehicleId, 
                   '","driverName":"', _driverName, '"}'))
        );
    }
    
    /**
     * @dev Add delivery checkpoint
     */
    function addDeliveryCheckpoint(
        uint256 _orderId,
        string memory _gpsCoordinates,
        string memory _description
    ) external onlyLogistics orderExists(_orderId) {
        
        Order storage order = orders[_orderId];
        require(order.status == OrderStatus.IN_TRANSIT, 
                "Order must be in transit to add checkpoints");
        
        order.delivery.checkpoints.push(_gpsCoordinates);
        
        addOrderTrackingStep(
            _orderId,
            "CHECKPOINT",
            "In Transit",
            _description,
            _gpsCoordinates,
            string(abi.encodePacked('{"vehicleId":"', order.delivery.vehicleId, 
                   '","driverName":"', order.delivery.driverName, '"}'))
        );
    }
    
    /**
     * @dev Complete delivery
     */
    function completeDelivery(
        uint256 _orderId,
        string memory _deliveryProof
    ) external onlyLogistics orderExists(_orderId) {
        
        Order storage order = orders[_orderId];
        require(order.status == OrderStatus.IN_TRANSIT, 
                "Order must be in transit to complete delivery");
        
        order.status = OrderStatus.DELIVERED;
        order.delivery.actualDelivery = block.timestamp;
        
        addOrderTrackingStep(
            _orderId,
            "DELIVERED",
            order.deliveryAddress,
            "Order delivered successfully",
            "",
            string(abi.encodePacked('{"deliveryProof":"', _deliveryProof, 
                   '","deliveredAt":', uint2str(block.timestamp), '}'))
        );
        
        emit OrderStatusUpdated(_orderId, OrderStatus.DELIVERED, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Add order tracking step
     */
    function addOrderTrackingStep(
        uint256 _orderId,
        string memory _stepType,
        string memory _location,
        string memory _description,
        string memory _gpsCoordinates,
        string memory _additionalData
    ) internal {
        
        supplyChainCounter++;
        
        SupplyChainStep memory newStep = SupplyChainStep({
            stepId: supplyChainCounter,
            stepType: _stepType,
            location: _location,
            description: _description,
            actor: msg.sender,
            timestamp: block.timestamp,
            gpsCoordinates: _gpsCoordinates,
            additionalData: _additionalData
        });
        
        orderSupplyChain[_orderId].push(newStep);
    }
    
    // ========================================
    // AUTHORIZATION FUNCTIONS
    // ========================================
    
    function authorizeFarmer(address _farmer) external onlyOwner {
        authorizedFarmers[_farmer] = true;
    }
    
    function revokeFarmer(address _farmer) external onlyOwner {
        authorizedFarmers[_farmer] = false;
    }
    
    function authorizeLogistics(address _logistics) external onlyOwner {
        authorizedLogistics[_logistics] = true;
    }
    
    function revokeLogistics(address _logistics) external onlyOwner {
        authorizedLogistics[_logistics] = false;
    }
    
    function authorizeInspector(address _inspector) external onlyOwner {
        authorizedInspectors[_inspector] = true;
    }
    
    function revokeInspector(address _inspector) external onlyOwner {
        authorizedInspectors[_inspector] = false;
    }
    
    // ========================================
    // VIEW FUNCTIONS
    // ========================================
    
    /**
     * @dev Get product details
     */
    function getProduct(uint256 _productId) external view 
        productExists(_productId) returns (Product memory) {
        return products[_productId];
    }
    
    /**
     * @dev Get product supply chain
     */
    function getProductSupplyChain(uint256 _productId) external view 
        productExists(_productId) returns (SupplyChainStep[] memory) {
        return productSupplyChain[_productId];
    }
    
    /**
     * @dev Get order details
     */
    function getOrder(uint256 _orderId) external view 
        orderExists(_orderId) returns (Order memory) {
        return orders[_orderId];
    }
    
    /**
     * @dev Get order supply chain
     */
    function getOrderSupplyChain(uint256 _orderId) external view 
        orderExists(_orderId) returns (SupplyChainStep[] memory) {
        return orderSupplyChain[_orderId];
    }
    
    /**
     * @dev Get all products
     */
    function getAllProducts() external view returns (uint256[] memory) {
        return productIds;
    }
    
    /**
     * @dev Get all orders
     */
    function getAllOrders() external view returns (uint256[] memory) {
        return orderIds;
    }
    
    /**
     * @dev Get products by farmer
     */
    function getProductsByFarmer(address _farmer) external view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](productIds.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < productIds.length; i++) {
            if (products[productIds[i]].farmer == _farmer) {
                result[count] = productIds[i];
                count++;
            }
        }
        
        // Resize array
        uint256[] memory resizedResult = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            resizedResult[i] = result[i];
        }
        
        return resizedResult;
    }
    
    /**
     * @dev Get orders by customer
     */
    function getOrdersByCustomer(address _customer) external view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](orderIds.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < orderIds.length; i++) {
            if (orders[orderIds[i]].customer == _customer) {
                result[count] = orderIds[i];
                count++;
            }
        }
        
        // Resize array
        uint256[] memory resizedResult = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            resizedResult[i] = result[i];
        }
        
        return resizedResult;
    }
    
    // ========================================
    // UTILITY FUNCTIONS
    // ========================================
    
    function getStatusString(OrderStatus _status) internal pure returns (string memory) {
        if (_status == OrderStatus.PENDING) return "PENDING";
        if (_status == OrderStatus.CONFIRMED) return "CONFIRMED";
        if (_status == OrderStatus.PREPARING) return "PREPARING";
        if (_status == OrderStatus.IN_TRANSIT) return "IN_TRANSIT";
        if (_status == OrderStatus.DELIVERED) return "DELIVERED";
        if (_status == OrderStatus.CANCELLED) return "CANCELLED";
        return "UNKNOWN";
    }
    
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
    
    function addressToString(address _addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }
    
    // ========================================
    // EMERGENCY FUNCTIONS
    // ========================================
    
    /**
     * @dev Pause contract in case of emergency
     */
    bool public paused = false;
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    function pause() external onlyOwner {
        paused = true;
    }
    
    function unpause() external onlyOwner {
        paused = false;
    }
    
    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        owner = _newOwner;
    }
}
