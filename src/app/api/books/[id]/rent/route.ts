import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST /api/books/[id]/rent - Rent a book
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        rentals: {
          where: {
            returnedAt: null,
          },
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Check if book is already rented
    if (book.rentals.length > 0) {
      return NextResponse.json(
        { error: "Book is already rented" },
        { status: 400 }
      );
    }

    const rental = await prisma.rental.create({
      data: {
        bookId: id,
        userId: session.user.id,
      },
      include: {
        book: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(rental, { status: 201 });
  } catch (error) {
    console.error("Error renting book:", error);
    return NextResponse.json({ error: "Failed to rent book" }, { status: 500 });
  }
}

// DELETE /api/books/[id]/rent - Return a book
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const activeRental = await prisma.rental.findFirst({
      where: {
        bookId: id,
        returnedAt: null,
      },
    });

    if (!activeRental) {
      return NextResponse.json(
        { error: "No active rental found for this book" },
        { status: 404 }
      );
    }

    // Only the person who rented can return
    if (activeRental.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only return books you have rented" },
        { status: 403 }
      );
    }

    const rental = await prisma.rental.update({
      where: { id: activeRental.id },
      data: {
        returnedAt: new Date(),
      },
      include: {
        book: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(rental);
  } catch (error) {
    console.error("Error returning book:", error);
    return NextResponse.json(
      { error: "Failed to return book" },
      { status: 500 }
    );
  }
}
