import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import MixinStorage "blob-storage/Mixin";
import Migration "migration";

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

  type ItemType = {
    #sale;
    #purchase;
    #returned;
  };

  type TransactionRecord = {
    id : Nat;
    item : JewelleryItem;
    transactionType : ItemType;
    timestamp : Int;
  };

  type AnalyticsData = {
    totalInventoryValue : Float;
    numberOfPieces : Nat;
    salesCount : Nat;
    purchaseCount : Nat;
    returnCount : Nat;
  };

  type Customer = {
    name : Text;
    transactionHistory : [TransactionRecord];
    currentHoldings : [JewelleryItem];
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

  public shared ({ caller }) func addTransaction(
    code : Text,
    transactionType : ItemType,
    timestamp : Int,
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
        };

        items.add(code, updatedItem);
        transactions.add(nextTransactionId, record);
        nextTransactionId += 1;
        "Transaction successful";
      };
    };
  };

  public query ({ caller }) func getAllItems() : async [JewelleryItem] {
    items.values().toArray().sort();
  };

  public query ({ caller }) func getAvailableItemsByType(itemType : ItemType) : async [JewelleryItem] {
    let iter = items.values().toArray().filter(
      func(item) {
        item.itemType == itemType and not item.isSold
      }
    );
    iter.sort();
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
    var returnCount = 0;

    for (item in items.values()) {
      if (not item.isSold) {
        totalInventoryValue += item.netWeight;
        numberOfPieces += item.pieces;

        switch (item.itemType) {
          case (#sale) { salesCount += 1 };
          case (#purchase) { purchaseCount += 1 };
          case (#returned) { returnCount += 1 };
        };
      };
    };

    {
      totalInventoryValue;
      numberOfPieces;
      salesCount;
      purchaseCount;
      returnCount;
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

  public shared ({ caller }) func updateCustomer(name : Text, newTransaction : TransactionRecord, newItem : JewelleryItem) : async () {
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

  public shared ({ caller }) func addBatchTransactions(
    transactionsArray : [(Text, ItemType, Int)]
  ) : async [Text] {
    var results : [Text] = [];
    for ((code, transactionType, timestamp) in transactionsArray.values()) {
      let result = await addTransaction(code, transactionType, timestamp);
      results := results.concat([result]);
    };
    results;
  };
};
