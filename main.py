from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, SessionLocal
import models
from schemas import TicketCreate, TicketUpdate

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[ "http://localhost:5173",
        "https://frontendsupport-36oa66gtj-ankita03715.vercel.app",],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return {"message": "Support CRM API is running!"}


@app.post("/api/tickets")
@app.post("/api/tickets")
def create_ticket(ticket: TicketCreate, db: Session = Depends(get_db)):

    last_ticket = db.query(models.Ticket).order_by(
        models.Ticket.id.desc()
    ).first()

    if last_ticket:
        next_number = last_ticket.id + 1
    else:
        next_number = 1

    ticket_id = f"TKT-{next_number:03d}"

    new_ticket = models.Ticket(
        ticket_id=ticket_id,
        customer_name=ticket.customer_name,
        customer_email=ticket.customer_email,
        subject=ticket.subject,
        description=ticket.description
    )

    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)

    return {
        "ticket_id": new_ticket.ticket_id,
        "created_at": new_ticket.created_at
    }

@app.get("/api/tickets")
def get_tickets(
    status: str = None,
    search: str = None,
    db: Session = Depends(get_db)
):

    query = db.query(models.Ticket)

    if status:
        query = query.filter(models.Ticket.status == status)

    if search:
        search_text = f"%{search}%"

        query = query.filter(
            (models.Ticket.ticket_id.ilike(search_text)) |
            (models.Ticket.customer_name.ilike(search_text)) |
            (models.Ticket.customer_email.ilike(search_text)) |
            (models.Ticket.description.ilike(search_text))
        )

    tickets = query.all()

    return [
        {
            "ticket_id": ticket.ticket_id,
            "customer_name": ticket.customer_name,
            "subject": ticket.subject,
            "status": ticket.status,
            "created_at": ticket.created_at
        }
        for ticket in tickets
    ]

@app.get("/api/tickets/{ticket_id}")
def get_ticket(ticket_id: str, db: Session = Depends(get_db)):

    ticket = db.query(models.Ticket).filter(
        models.Ticket.ticket_id == ticket_id
    ).first()

    if not ticket:
        return {"error": "Ticket not found"}

    notes = db.query(models.Note).filter(
        models.Note.ticket_id == ticket.ticket_id
    ).all()

    return {
        "ticket_id": ticket.ticket_id,
        "customer_name": ticket.customer_name,
        "customer_email": ticket.customer_email,
        "subject": ticket.subject,
        "description": ticket.description,
        "status": ticket.status,
        "notes": [
            {
                "note_text": note.note_text,
                "created_at": note.created_at
            }
            for note in notes
        ]
    }

@app.put("/api/tickets/{ticket_id}")
def update_ticket(
    ticket_id: str,
    ticket_update: TicketUpdate,
    db: Session = Depends(get_db)
):

    ticket = db.query(models.Ticket).filter(
        models.Ticket.ticket_id == ticket_id
    ).first()

    if not ticket:
        return {"error": "Ticket not found"}

    ticket.status = ticket_update.status

    if ticket_update.notes:
        new_note = models.Note(
            ticket_id=ticket.ticket_id,
            note_text=ticket_update.notes
        )

        db.add(new_note)

    db.commit()
    db.refresh(ticket)

    return {
        "success": True,
        "updated_at": ticket.updated_at
    }

@app.delete("/api/tickets/{ticket_id}")
def delete_ticket(ticket_id: str, db: Session = Depends(get_db)):

    ticket = db.query(models.Ticket).filter(
        models.Ticket.ticket_id == ticket_id
    ).first()

    if not ticket:
        return {"error": "Ticket not found"}

    db.query(models.Note).filter(
        models.Note.ticket_id == ticket.ticket_id
    ).delete()

    db.delete(ticket)
    db.commit()

    return {"success": True}
