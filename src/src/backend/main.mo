import Float "mo:core/Float";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Order "mo:core/Order";
import MixinStorage "blob-storage/Mixin";



actor {
  include MixinStorage();

  public type ItemType = {
    #sale;
    #purchase;
    #purchaseReturn;
    #salesReturn;
  };

  public type JewelleryItem = {
    code : Text;
    grossWeight : Float;
    stoneWeight : Float;
    netWeight : Float;
    pieces : Nat;
    itemType : ItemType;
    isSold : Bool;
  };

  public type TransactionRecord = {
    id : Nat;
    item : JewelleryItem;
    transactionType : ItemType;
    timestamp : Int;
    customerName : ?Text;
    quantity : Nat;
    netWeight : Float;
    transactionCode : Text;
    metalPurity : ?Float;
    metalBalance : ?Float;
    stoneChargePerGram : ?Float;
    cashBalance : ?Float;
  };

  public type Customer = {
    name : Text;
    transactionHistory : [TransactionRecord];
    currentHoldings : [JewelleryItem];
  };

  public type TransactionInput = {
    code : Text;
    transactionType : ItemType;
    timestamp : Int;
    customerName : ?Text;
    quantity : Nat;
    netWeight : Float;
    transactionCode : Text;
    metalPurity : ?Float;
    metalBalance : ?Float;
    stoneChargePerGram : ?Float;
    cashBalance : ?Float;
    grossWeight : ?Float;
    stoneWeight : ?Float;
  };

  public type TransactionAggregate = {
    totalWeight : Float;
    totalPieces : Nat;
  };

  public type AnalyticsData = {
    salesAggregate : TransactionAggregate;
    purchaseAggregate : TransactionAggregate;
    salesReturnAggregate : TransactionAggregate;
    purchaseReturnAggregate : TransactionAggregate;
  };

  let items = Map.empty<Text, JewelleryItem>();
  let transactions = Map.empty<Nat, TransactionRecord>();
  let customers = Map.empty<Text, Customer>();
  var nextTransactionId = 1;

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

  // Helper: upsert a transaction record into a customer's history (create customer if needed)
  func upsertCustomerTransaction(name : Text, record : TransactionRecord, addHolding : ?JewelleryItem) : () {
    switch (customers.get(name)) {
      case (null) {
        let holdings : [JewelleryItem] = switch (addHolding) {
          case (?item) { [item] };
          case (null) { [] };
        };
        let newCustomer : Customer = {
          name;
          transactionHistory = [record];
          currentHoldings = holdings;
        };
        customers.add(name, newCustomer);
      };
      case (?customer) {
        let updatedHoldings : [JewelleryItem] = switch (addHolding) {
          case (?item) { customer.currentHoldings.concat([item]) };
          case (null) { customer.currentHoldings };
        };
        let updatedCustomer : Customer = {
          name;
          transactionHistory = customer.transactionHistory.concat([record]);
          currentHoldings = updatedHoldings;
        };
        customers.add(name, updatedCustomer);
      };
    };
  };

  // Private synchronous helper — no await, safe to call in loops
  func addTransactionInternal(
    code : Text,
    transactionType : ItemType,
    timestamp : Int,
    customerName : ?Text,
    quantity : Nat,
    netWeight : Float,
    transactionCode : Text,
    metalPurity : ?Float,
    metalBalance : ?Float,
    stoneChargePerGram : ?Float,
    cashBalance : ?Float,
    grossWeight : ?Float,
    stoneWeight : ?Float,
  ) : Text {
    switch (items.get(code)) {
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
          metalPurity;
          metalBalance;
          stoneChargePerGram;
          cashBalance;
        };

        items.add(code, updatedItem);
        transactions.add(nextTransactionId, record);
        nextTransactionId += 1;

        // Update customer history for sales AND sales returns
        switch (customerName, transactionType) {
          case (?name, #sale) {
            upsertCustomerTransaction(name, record, ?updatedItem);
          };
          case (?name, #salesReturn) {
            upsertCustomerTransaction(name, record, null);
          };
          case (_, _) {};
        };

        "Transaction successful";
      };
      case (null) {
        // Create new item on-the-fly — use quantity for pieces so stock counts match
        let newItem : JewelleryItem = {
          code;
          grossWeight = switch (grossWeight) {
            case (null) { netWeight };
            case (?weight) { weight };
          };
          stoneWeight = switch (stoneWeight) {
            case (null) { 0.0 };
            case (?weight) { weight };
          };
          netWeight;
          pieces = quantity;
          itemType = transactionType;
          isSold = (transactionType == #sale);
        };

        let record : TransactionRecord = {
          id = nextTransactionId;
          item = newItem;
          transactionType;
          timestamp;
          customerName;
          quantity;
          netWeight;
          transactionCode;
          metalPurity;
          metalBalance;
          stoneChargePerGram;
          cashBalance;
        };

        items.add(code, newItem);
        transactions.add(nextTransactionId, record);
        nextTransactionId += 1;

        // Update customer history for sales AND sales returns
        switch (customerName, transactionType) {
          case (?name, #sale) {
            upsertCustomerTransaction(name, record, ?newItem);
          };
          case (?name, #salesReturn) {
            upsertCustomerTransaction(name, record, null);
          };
          case (_, _) {};
        };

        "Transaction successful";
      };
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
    metalPurity : ?Float,
    metalBalance : ?Float,
    stoneChargePerGram : ?Float,
    cashBalance : ?Float,
    grossWeight : ?Float,
    stoneWeight : ?Float,
  ) : async Text {
    addTransactionInternal(
      code,
      transactionType,
      timestamp,
      customerName,
      quantity,
      netWeight,
      transactionCode,
      metalPurity,
      metalBalance,
      stoneChargePerGram,
      cashBalance,
      grossWeight,
      stoneWeight,
    );
  };

  // Batch transactions — uses synchronous helper, no await-in-loop
  public shared ({ caller }) func addBatchTransactions(transactionsArray : [TransactionInput]) : async [Text] {
    var results : [Text] = [];
    for (transaction in transactionsArray.values()) {
      let result = addTransactionInternal(
        transaction.code,
        transaction.transactionType,
        transaction.timestamp,
        transaction.customerName,
        transaction.quantity,
        transaction.netWeight,
        transaction.transactionCode,
        transaction.metalPurity,
        transaction.metalBalance,
        transaction.stoneChargePerGram,
        transaction.cashBalance,
        transaction.grossWeight,
        transaction.stoneWeight,
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

  func filterAndAggregateTransactions(transactionType : ItemType) : TransactionAggregate {
    let filteredResults = transactions.entries().toArray().filter(
      func((_, record)) {
        record.transactionType == transactionType;
      }
    );

    filteredResults.foldLeft(
      { totalWeight = 0.0; totalPieces = 0 },
      func(acc, (_, record)) {
        {
          totalWeight = acc.totalWeight + record.item.grossWeight;
          // Use record.quantity (actual piece count from input) not item.pieces
          totalPieces = acc.totalPieces + record.quantity;
        };
      },
    );
  };

  public query ({ caller }) func getTypeAggregates() : async AnalyticsData {
    {
      salesAggregate = filterAndAggregateTransactions(#sale);
      purchaseAggregate = filterAndAggregateTransactions(#purchase);
      salesReturnAggregate = filterAndAggregateTransactions(#salesReturn);
      purchaseReturnAggregate = filterAndAggregateTransactions(#purchaseReturn);
    };
  };

  // Rename customer and update transaction records
  public shared ({ caller }) func renameCustomer(oldName : Text, newName : Text) : async () {
    switch (customers.get(oldName)) {
      case (null) {};
      case (?customer) {
        customers.remove(oldName);
        if (newName != "") {
          let updatedCustomer : Customer = {
            name = newName;
            transactionHistory = customer.transactionHistory;
            currentHoldings = customer.currentHoldings;
          };
          customers.add(newName, updatedCustomer);
        };
      };
    };

    // Update all transactions with oldName
    let updatedTransactions = transactions.map<Nat, TransactionRecord, TransactionRecord>(
      func(_id, record) {
        switch (record.customerName) {
          case (?name) {
            if (name == oldName) {
              {
                record with
                customerName = if (newName == "") { null } else { ?newName };
              };
            } else { record };
          };
          case (null) { record };
        };
      }
    );

    transactions.clear();
    for ((id, record) in updatedTransactions.entries()) {
      transactions.add(id, record);
    };
  };

  public shared ({ caller }) func resetAllData() : async () {
    items.clear();
    transactions.clear();
    customers.clear();
    nextTransactionId := 1;
  };
  // Delete a sale transaction and return the item to stock
  public shared ({ caller }) func deleteSaleTransaction(transactionId : Nat) : async Text {
    switch (transactions.get(transactionId)) {
      case (null) { "Transaction not found" };
      case (?tx) {
        if (tx.transactionType != #sale) {
          return "Can only delete sale transactions";
        };

        // Mark item as not sold (return to stock)
        switch (items.get(tx.item.code)) {
          case (?item) {
            let updatedItem = {
              item with
              isSold = false;
              itemType = #purchase;
            };
            items.add(tx.item.code, updatedItem);
          };
          case (null) {};
        };

        // Remove transaction record
        transactions.remove(transactionId);

        // Remove transaction from customer history
        switch (tx.customerName) {
          case (?name) {
            switch (customers.get(name)) {
              case (?customer) {
                let updatedHistory = customer.transactionHistory.filter(
                  func(t : TransactionRecord) : Bool { t.id != transactionId }
                );
                let updatedHoldings = customer.currentHoldings.filter(
                  func(i : JewelleryItem) : Bool { i.code != tx.item.code }
                );
                let updatedCustomer : Customer = {
                  name;
                  transactionHistory = updatedHistory;
                  currentHoldings = updatedHoldings;
                };
                customers.add(name, updatedCustomer);
              };
              case (null) {};
            };
          };
          case (null) {};
        };

        "Transaction deleted successfully"
      };
    };
  };


};
