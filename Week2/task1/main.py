from fastapi import FastAPI
from database import SessionLocal
from models import Product
from schemas import ProductCreate

app = FastAPI()


@app.post("/product")
def add_product(product: ProductCreate):

    db = SessionLocal()

    new_product = Product(
        name=product.name,
        price=product.price,
        quantity=product.quantity
    )

    db.add(new_product)
    db.commit()

    return {"message": "Product added successfully"}


@app.get("/product")
def get_products():

    db = SessionLocal()

    products = db.query(Product).all()

    return products
