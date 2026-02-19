import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Array "mo:core/Array";

module {
  type OldJewelleryItem = {
    code : Text;
    grossWeight : Float;
    stoneWeight : Float;
    netWeight : Float;
    pieces : Nat;
    itemType : {
      #sale;
      #purchase;
      #returned;
    };
  };

  type NewJewelleryItem = {
    code : Text;
    grossWeight : Float;
    stoneWeight : Float;
    netWeight : Float;
    pieces : Nat;
    itemType : {
      #sale;
      #purchase;
      #returned;
    };
    isSold : Bool;
  };

  type OldTransactionRecord = {
    id : Nat;
    item : OldJewelleryItem;
    transactionType : {
      #sale;
      #purchase;
      #returned;
    };
    timestamp : Int;
  };

  type NewTransactionRecord = {
    id : Nat;
    item : NewJewelleryItem;
    transactionType : {
      #sale;
      #purchase;
      #returned;
    };
    timestamp : Int;
  };

  type OldCustomer = {
    name : Text;
    transactionHistory : [OldTransactionRecord];
    currentHoldings : [OldJewelleryItem];
  };

  type NewCustomer = {
    name : Text;
    transactionHistory : [NewTransactionRecord];
    currentHoldings : [NewJewelleryItem];
  };

  type OldActor = {
    items : Map.Map<Text, OldJewelleryItem>;
    transactions : Map.Map<Nat, OldTransactionRecord>;
    customers : Map.Map<Text, OldCustomer>;
    nextTransactionId : Nat;
  };

  type NewActor = {
    items : Map.Map<Text, NewJewelleryItem>;
    transactions : Map.Map<Nat, NewTransactionRecord>;
    customers : Map.Map<Text, NewCustomer>;
    nextTransactionId : Nat;
  };

  // Simple conversion functions
  func convertItem(old : OldJewelleryItem) : NewJewelleryItem {
    { old with isSold = false };
  };

  func convertTransaction(old : OldTransactionRecord) : NewTransactionRecord {
    {
      id = old.id;
      item = convertItem(old.item);
      transactionType = old.transactionType;
      timestamp = old.timestamp;
    };
  };

  func convertCustomer(old : OldCustomer) : NewCustomer {
    {
      name = old.name;
      transactionHistory = old.transactionHistory.map(convertTransaction);
      currentHoldings = old.currentHoldings.map(convertItem);
    };
  };

  // Full actor conversion
  public func run(old : OldActor) : NewActor {
    let newItems = old.items.map<Text, OldJewelleryItem, NewJewelleryItem>(
      func(_code, oldItem) { convertItem(oldItem) }
    );

    let newTransactions = old.transactions.map<Nat, OldTransactionRecord, NewTransactionRecord>(
      func(_id, oldTrans) { convertTransaction(oldTrans) }
    );

    let newCustomers = old.customers.map<Text, OldCustomer, NewCustomer>(
      func(_name, oldCust) { convertCustomer(oldCust) }
    );

    {
      items = newItems;
      transactions = newTransactions;
      customers = newCustomers;
      nextTransactionId = old.nextTransactionId;
    };
  };
};
