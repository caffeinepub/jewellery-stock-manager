import Float "mo:core/Float";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Migration "migration";

import MixinStorage "blob-storage/Mixin";

// Use migration via the with clause
(with migration = Migration.run)
actor {
  include MixinStorage();

  type JewelleryItem = {
    code : Text;
    grossWeight : Float;
    stoneWeight : Float;
    netWeight : Float;
    pieces : Nat;
    itemType : ItemType;
    isSold : Bool;
  };

  public type ItemType = {
    #sale;
    #purchase;
    #purchaseReturn;
    #salesReturn;
  };

  type TransactionRecord = {
    id : Nat;
    item : JewelleryItem;
    transactionType : ItemType;
    timestamp : Int;
    customerName : ?Text;
    quantity : Nat;
    netWeight : Float;
    transactionCode : Text;
  };

  type Customer = {
    name : Text;
    transactionHistory : [TransactionRecord];
    currentHoldings : [JewelleryItem];
  };

  public type AnalyticsData = {
    totalInventoryValue : Float;
    numberOfPieces : Nat;
    salesCount : Nat;
    purchaseCount : Nat;
    purchaseReturnCount : Nat;
    salesReturnCount : Nat;
    currentStockPieces : Nat;
    currentStockNetWeight : Float;
    salesTransactionCount : Nat;
    totalPiecesSold : Nat;
    totalWeightSold : Float;
    totalWeightPurchased : Float;
    totalPiecesPurchased : Nat;
    totalPurchaseReturnWeight : Float;
    totalPurchaseReturnPieceCount : Nat;
    totalSalesReturnWeight : Float;
    totalSalesReturnPieceCount : Nat;
  };

  type TransactionInput = {
    code : Text;
    transactionType : ItemType;
    timestamp : Int;
    customerName : ?Text;
    quantity : Nat;
    netWeight : Float;
    transactionCode : Text;
  };

  var nextTransactionId = 1;

  let items = Map.empty<Text, JewelleryItem>();
  let transactions = Map.empty<Nat, TransactionRecord>();
  let customers = Map.empty<Text, Customer>();

  module JewelleryItem {
    public func compare(a : JewelleryItem, b : JewelleryItem) : Order.Order {
      Text.compare(a.code, b.code);
    };
  };

  module TransactionRecord {
    public func compare(a : TransactionRecord, b : TransactionRecord) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  module Customer {
    public func compare(a : Customer, b : Customer) : Order.Order {
      Text.compare(a.name, b.name);
    };
  };

  public shared ({ caller }) func addItem(
    code : Text,
    grossWeight : Float,
    stoneWeight : Float,
    netWeight : Float,
    pieces : Nat,
    itemType : ItemType,
  ) : async () {
    let item : JewelleryItem = {
      code;
      grossWeight;
      stoneWeight;
      netWeight;
      pieces;
      itemType;
      isSold = false;
    };
    items.add(code, item);
  };

  public shared ({ caller }) func addBatchItems(itemsArray : [(Text, Float, Float, Float, Nat, ItemType)]) : async () {
    for ((code, grossWeight, stoneWeight, netWeight, pieces, itemType) in itemsArray.values()) {
      let item : JewelleryItem = {
        code;
        grossWeight;
        stoneWeight;
        netWeight;
        pieces;
        itemType;
        isSold = false;
      };
      items.add(code, item);
    };
  };

  public shared ({ caller }) func addTransaction(
    code : Text,
    transactionType : ItemType,
    timestamp : Int,
    customerName : ?Text,
    quantity : Nat,
    netWeight : Float,
    transactionCode : Text,
  ) : async Text {
    switch (items.get(code)) {
      case (null) { "Item not found" };
      case (?item) {
        if (transactionType == #sale and item.isSold) {
          return "Item already sold";
        };

        let updatedItem = {
          item with
          itemType = transactionType;
          isSold = (transactionType == #sale);
        };

        let record : TransactionRecord = {
          id = nextTransactionId;
          item = updatedItem;
          transactionType;
          timestamp;
          customerName;
          quantity;
          netWeight;
          transactionCode;
        };

        items.add(code, updatedItem);
        transactions.add(nextTransactionId, record);
        nextTransactionId += 1;

        switch (customerName, transactionType) {
          case (?name, #sale) {
            switch (customers.get(name)) {
              case (null) {
                let newCustomer : Customer = {
                  name;
                  transactionHistory = [record];
                  currentHoldings = [updatedItem];
                };
                customers.add(name, newCustomer);
              };
              case (?customer) {
                let updatedCustomer : Customer = {
                  name;
                  transactionHistory = customer.transactionHistory.concat([record]);
                  currentHoldings = customer.currentHoldings.concat([updatedItem]);
                };
                customers.add(name, updatedCustomer);
              };
            };
          };
          case (_, _) {};
        };

        "Transaction successful";
      };
    };
  };

  public shared ({ caller }) func addBatchTransactions(transactionsArray : [TransactionInput]) : async [Text] {
    var results : [Text] = [];
    for (transaction in transactionsArray.values()) {
      let result = await addTransaction(
        transaction.code,
        transaction.transactionType,
        transaction.timestamp,
        transaction.customerName,
        transaction.quantity,
        transaction.netWeight,
        transaction.transactionCode,
      );
      results := results.concat([result]);
    };
    results;
  };

  public query ({ caller }) func getAllItems() : async [JewelleryItem] {
    items.values().toArray().sort();
  };

  public query ({ caller }) func getAvailableItemsByType(itemType : ItemType) : async [JewelleryItem] {
    let filteredArray = items.values().toArray().filter(
      func(item) {
        item.itemType == itemType and not item.isSold;
      }
    );
    filteredArray.sort();
  };

  public query ({ caller }) func getItem(code : Text) : async ?JewelleryItem {
    items.get(code);
  };

  public query ({ caller }) func getAllTransactions() : async [TransactionRecord] {
    transactions.values().toArray().sort();
  };

  public query ({ caller }) func getTransactionsByType(transactionType : ItemType) : async [TransactionRecord] {
    let filteredArray = transactions.values().toArray().filter(
      func(record) {
        record.transactionType == transactionType;
      }
    );
    filteredArray.sort();
  };

  public query ({ caller }) func getTransaction(id : Nat) : async ?TransactionRecord {
    transactions.get(id);
  };

  public query ({ caller }) func getAnalyticsData() : async AnalyticsData {
    var totalInventoryValue : Float = 0.0;
    var numberOfPieces = 0;
    var salesCount = 0;
    var purchaseCount = 0;
    var purchaseReturnCount = 0;
    var salesReturnCount = 0;

    var currentStockPieces = 0;
    var currentStockNetWeight : Float = 0.0;
    var totalPiecesPurchased = 0;
    var totalPiecesSold = 0;
    var salesTransactionCount = 0;
    var totalWeightSold : Float = 0.0;
    var totalWeightPurchased : Float = 0.0;
    var totalPurchaseReturnPieceCount = 0;
    var totalSalesReturnPieceCount = 0;
    var totalPurchaseReturnWeight : Float = 0.0;
    var totalSalesReturnWeight : Float = 0.0;

    for (item in items.values()) {
      if (not item.isSold) {
        totalInventoryValue += item.netWeight;
        numberOfPieces += item.pieces;
      };
    };

    for (transaction in transactions.values()) {
      switch (transaction.transactionType) {
        case (#purchase) {
          totalPiecesPurchased += transaction.quantity;
          totalWeightPurchased += transaction.netWeight;
        };
        case (#sale) {
          totalPiecesSold += transaction.quantity;
          totalWeightSold += transaction.netWeight;
          salesTransactionCount += 1;
        };
        case (#purchaseReturn) {
          totalPurchaseReturnPieceCount += transaction.quantity;
          totalPurchaseReturnWeight += transaction.netWeight;
        };
        case (#salesReturn) {
          totalSalesReturnPieceCount += transaction.quantity;
          totalSalesReturnWeight += transaction.netWeight;
        };
      };
    };

    currentStockPieces := totalPiecesPurchased - totalPiecesSold - totalPurchaseReturnPieceCount + totalSalesReturnPieceCount;
    currentStockNetWeight := if (
      totalWeightPurchased - totalWeightSold - totalPurchaseReturnWeight + totalSalesReturnWeight >= 0.0
    ) {
      totalWeightPurchased - totalWeightSold - totalPurchaseReturnWeight + totalSalesReturnWeight;
    } else { 0.0 };

    {
      totalInventoryValue;
      numberOfPieces;
      salesCount;
      purchaseCount;
      purchaseReturnCount;
      salesReturnCount;
      currentStockPieces;
      currentStockNetWeight;
      salesTransactionCount;
      totalPiecesSold;
      totalWeightSold;
      totalWeightPurchased;
      totalPiecesPurchased;
      totalPurchaseReturnWeight;
      totalPurchaseReturnPieceCount;
      totalSalesReturnWeight;
      totalSalesReturnPieceCount;
    };
  };

  public shared ({ caller }) func createCustomer(name : Text) : async () {
    let customer : Customer = {
      name;
      transactionHistory = [];
      currentHoldings = [];
    };
    customers.add(name, customer);
  };

  public query ({ caller }) func getCustomer(name : Text) : async ?Customer {
    customers.get(name);
  };

  public shared ({ caller }) func updateCustomer(
    name : Text,
    newTransaction : TransactionRecord,
    newItem : JewelleryItem,
  ) : async () {
    switch (customers.get(name)) {
      case (null) {};
      case (?customer) {
        let updatedCustomer : Customer = {
          name;
          transactionHistory = customer.transactionHistory.concat([newTransaction]);
          currentHoldings = customer.currentHoldings.concat([newItem]);
        };
        customers.add(name, updatedCustomer);
      };
    };
  };

  public shared ({ caller }) func deleteCustomer(name : Text) : async () {
    customers.remove(name);
  };

  public query ({ caller }) func getAllCustomers() : async [Customer] {
    customers.values().toArray().sort();
  };
};
