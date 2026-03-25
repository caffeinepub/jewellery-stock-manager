import Map "mo:core/Map";
import Float "mo:core/Float";
import Nat "mo:core/Nat";

module {
  type ItemType = {
    #sale;
    #purchase;
    #returned;
  };

  type JewelleryItem = {
    code : Text;
    grossWeight : Float;
    stoneWeight : Float;
    netWeight : Float;
    pieces : Nat;
    itemType : ItemType;
    isSold : Bool;
  };

  type Customer = {
    name : Text;
    transactionHistory : [TransactionRecord];
    currentHoldings : [JewelleryItem];
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

  public func calculateAnalytics(
    items : Map.Map<Text, JewelleryItem>,
    _customers : Map.Map<Text, Customer>,
  ) : AnalyticsData {
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
};

