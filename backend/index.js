const mongoose = require("mongoose"); // for connection
const express = require("express"); // for port
const app = express(); // for port
const { v4: uuidv4 } = require("uuid"); // uniq bir değer üretir
const multer = require("multer"); // resim eklemk için
const cors = require("cors");
const jwt = require("jsonwebtoken");
const path = require("path");

app.use(cors());
app.use(express.json()); // gelen api isteklerini json formatına dönüştürür
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // dosya erişimine izin verme

// Connection start

const uri =
  "mongodb+srv://MongoDb:1@reacteticaretdb.z8nth1v.mongodb.net/?retryWrites=true&w=majority";
mongoose
  .connect(uri)
  .then((res) => {
    console.log("Database Bağlantısı Başarılı");
  })
  .catch((err) => {
    console.log(err.message);
  });
// Connection End
// userSchema start - user collection table isimleri mongoDb de collection
const userSchema = new mongoose.Schema({
  _id: String,
  name: String,
  email: String,
  password: String,
  isAdmin: Boolean,
});

const User = mongoose.model("User", userSchema);
// userSchema end

//Product Collection Start
const productSchema = new mongoose.Schema({
  _id: String,
  name: String,
  stock: Number,
  price: Number,
  imageUrl: String,
  categoryName: String,
});

const Product = mongoose.model("Product", productSchema);
// Product collection end

// Basket Collection start
const basketSchema = new mongoose.Schema({
  _id: String,
  productId: String,
  userId: String,
  count: Number,
  price: Number,
});

const Basket = mongoose.model("Basket", basketSchema);
// Basket Collection end

//Order collection start
const orderSchema = new mongoose.Schema({
  _id: String,
  productId: String,
  userId: String,
});

const Order = mongoose.model("Order", orderSchema);
// Order collection end
// Token
const secretKey = "Gizli Anahtarım Gizli Anahtarım Gizli Anahtarım";
const options = {
  expiresIn: "1h",
};
// Token
// Register start
app.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = new User({
      _id: uuidv4(),
      name: name,
      email: email,
      password: password,
      isAdmin: false,
    });

    await user.save();
    const payload = {
      user: user,
    };
    const token = jwt.sign(payload, secretKey, options);
    res.json({ user: user, token: token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register end

//Login Methot start

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = await User.find({ email: email, password: password });
    if (users.length == 0) {
      res.status(500).json({ message: "Mail adresi ya da şifre yanlış!" });
    } else {
      const payload = {
        user: users[0],
      };
      const token = jwt.sign(payload, secretKey, options);
      res.json({ user: users[0], token: token });
    }
  } catch (error) {}
});

//Product Listesi

app.get("/products", async (req, res) => {
  try {
    const products = await Product.find({}).sort({ name: 1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "ürün listelenemedi" + error.message });
  }
});
// Product  Listesi

//dosya kayıt işlemi
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });
//dosya kayıt işlemi

// Add product
app.post("/products/add", upload.single("image"), async (req, res) => {
  try {
    const { name, categoryName, stock, price, imageUrl } = req.body;
    const product = new Product({
      _id: uuidv4(),
      name: name,
      stock: stock,
      price: price,
      categoryName: categoryName,
      imageUrl: req.file.path,
    });

    await product.save();
    res.json({ message: "Ürün kaydı başarıyla tamamlandı!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Add product

//Remove Product
app.post("/products/remove", async (req, res) => {
  try {
    const { _id } = req.body;
    await Product.findByIdAndDelete(_id);
    res.json({ message: "Silme işlemi başarıyla gerçekleşti" });
  } catch (error) {
    res.status(500).json({ message: "ürün silinemedi" + error.message });
  }
});
//Remove Product
// Sepete Ürün Ekleme İşlemi
app.post("/baskets/add", async (req, res) => {
  try {
    const { productId, userId } = req.body;
    let basket = new Basket({
      _id: uuidv4(),
      userId: userId,
      productId: productId,
    });
    await basket.save();

    let product = await Product.findById(productId);
    product.stock = product.stock - 1;
    await Product.findByIdAndUpdate(productId, product);

    res.json({ message: "Ürün sepete başarıyla eklendi" });
  } catch (error) {
    res.status(500).json({ message: "ürün sepete eklenemedi" + error.message });
  }
});
// Sepete Ürün Ekleme İşlemi

//Sepetteki Ürünler
app.post("/baskets/getAll", async (req, res) => {
  try {
    const { userId } = req.body;
    const baskets = await Basket.aggregate([
      {
        $match: { userId: userId },
      },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "products",
        },
      },
    ]);
    res.json(baskets);
  } catch (error) {
    res.status(500).json({ message: "Sepet Boş" + error.message });
  }
});
//Sepetteki Ürünler
//Sepetteki Ürünü Sil
app.post("/baskets/remove", async (req, res) => {
  try {
    const { _id } = req.body;
    const basket = await Basket.findById(_id);
    const product = await Product.findById(basket.productId);
    product.stock += 1;
    await Product.findByIdAndUpdate(product._id, product);
    await Basket.findByIdAndDelete(_id);
    res.json({ message: "Silme İşlemi Başarılı" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Ürün Sepetten Silinmedi" + error.message });
  }
});
//Sepetteki Ürünü Sil
//Sipariş Oluşturma
app.post("/orders/add", async (req, res) => {
  try {
    const { userId } = req.body;
    const baskets = await Basket.find({ userId: userId });
    for (const basket of baskets) {
      let order = new Order({
        _id: uuidv4(),
        productId: basket.productId,
        userId: userId,
      });
      order.save();
      await Basket.findByIdAndDelete(basket._id);
    }
  } catch (error) {
    res.status(500).json({ message: "Sipariş Oluşturulamadı" + error.message });
  }
});
//Sipariş Oluşturma
//Sipariş Listesi
app.post("/orders", async (req, res) => {
  try {
    const { userId } = req.body;
    const orders = await Order.aggregate([
      {
        $match: { userId: userId },
      },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "products",
        },
      },
    ]);
    res.json(orders);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Sipariş Sayfası  Oluşmadı" + error.message });
  }
});
//Sipariş Listesi

// Port start
const port = 5000;
app.listen(5000, () => {
  console.log("Uygulama http://localhost:" + port + " port üzerinden ayakta");
});
//Port end
