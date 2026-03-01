import Map "mo:core/Map";
import Nat "mo:core/Nat";

module {
  type OldItemType = {
    #sale;
    #purchase;
    #returned;
  };

  type OldJewelleryItem = {
    code : Text;
    grossWeight : Float;
    stoneWeight : Float;
    netWeight : Float;
    pieces : Nat;
    itemType : OldItemType;
    isSold : Bool;
  };

  type OldTransactionRecord = {
    id : Nat;
    item : OldJewelleryItem;
    transactionType : OldItemType;
    timestamp : Int;
    customerName : ?Text;
    quantity : Nat;
    netWeight : Float;
    transactionCode : Text;
  };

  type OldCustomer = {
    name : Text;
    transactionHistory : [OldTransactionRecord];
    currentHoldings : [OldJewelleryItem];
  };

  type OldActor = {
    nextTransactionId : Nat;
    items : Map.Map<Text, OldJewelleryItem>;
    transactions : Map.Map<Nat, OldTransactionRecord>;
    customers : Map.Map<Text, OldCustomer>;
  };

  type NewItemType = {
    #sale;
    #purchase;
    #purchaseReturn;
    #salesReturn;
  };

  type NewJewelleryItem = {
    code : Text;
    grossWeight : Float;
    stoneWeight : Float;
    netWeight : Float;
    pieces : Nat;
    itemType : NewItemType;
    isSold : Bool;
  };

  type NewTransactionRecord = {
    id : Nat;
    item : NewJewelleryItem;
    transactionType : NewItemType;
    timestamp : Int;
    customerName : ?Text;
    quantity : Nat;
    netWeight : Float;
    transactionCode : Text;
  };

  type NewCustomer = {
    name : Text;
    transactionHistory : [NewTransactionRecord];
    currentHoldings : [NewJewelleryItem];
  };

  type NewActor = {
    nextTransactionId : Nat;
    items : Map.Map<Text, NewJewelleryItem>;
    transactions : Map.Map<Nat, NewTransactionRecord>;
    customers : Map.Map<Text, NewCustomer>;
  };

  public func run(old : OldActor) : NewActor {
    let newItems = old.items.map<Text, OldJewelleryItem, NewJewelleryItem>(
      func(_code, oldItem) {
        {
          oldItem with
          itemType = mapItemType(oldItem.itemType);
        };
      }
    );

    let newTransactions = old.transactions.map<Nat, OldTransactionRecord, NewTransactionRecord>(
      func(_id, oldTransaction) {
        {
          oldTransaction with
          item = {
            oldTransaction.item with
            itemType = mapItemType(oldTransaction.item.itemType);
          };
          transactionType = mapItemType(oldTransaction.transactionType);
        };
      }
    );

    let newCustomers = old.customers.map<Text, OldCustomer, NewCustomer>(
      func(_name, oldCustomer) {
        {
          oldCustomer with
          transactionHistory = oldCustomer.transactionHistory.map(
            func(oldTransaction) {
              {
                oldTransaction with
                item = {
                  oldTransaction.item with
                  itemType = mapItemType(oldTransaction.item.itemType);
                };
                transactionType = mapItemType(oldTransaction.transactionType);
              };
            }
          );
          currentHoldings = oldCustomer.currentHoldings.map(
            func(oldItem) {
              {
                oldItem with
                itemType = mapItemType(oldItem.itemType);
              };
            }
          );
        };
      }
    );

    {
      old with
      items = newItems;
      transactions = newTransactions;
      customers = newCustomers;
    };
  };

  func mapItemType(oldItemType : OldItemType) : NewItemType {
    switch (oldItemType) {
      case (#sale) { #sale };
      case (#purchase) { #purchase };
      case (#returned) { #purchaseReturn };
    };
  };
};
