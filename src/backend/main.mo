import Float "mo:core/Float";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Time "mo:core/Time";
import MixinStorage "blob-storage/Mixin";
import Analytics "analytics";

actor {
  include MixinStorage();

  // Type Definitions

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

  type Customer = {
    name : Text;
    transactionHistory : [TransactionRecord];
    currentHoldings : [JewelleryItem];
  };

  // New TransactionInput type for succinct data representation
  type TransactionInput = {
    code : Text;
    transactionType : ItemType;
    timestamp : Int;
  };

  var nextTransactionId = 1;

  // Persistent Store
  let items = Map.empty<Text, JewelleryItem>();
  let transactions = Map.empty<Nat, TransactionRecord>();
  let customers = Map.empty<Text, Customer>();

  type AnalyticsData = {
    totalInventoryValue : Float;
    numberOfPieces : Nat;
    salesCount : Nat;
    purchaseCount : Nat;
    returnCount : Nat;
  };

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

  public shared ({ caller }) func addBatchTransactions(transactionsArray : [TransactionInput]) : async [Text] {
    var results : [Text] = [];
    for (transaction in transactionsArray.values()) {
      let result = await addTransaction(transaction.code, transaction.transactionType, transaction.timestamp);
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

  // Cross-Module Analytics Call
  public query ({ caller }) func getAnalyticsData() : async AnalyticsData {
    Analytics.calculateAnalytics(items, customers);
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

  public query ({ caller }) func getAllCustomers() : async [Customer] {
    customers.values().toArray().sort();
  };
};
