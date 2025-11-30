import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/books - Get all books (public)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const available = searchParams.get("available");

  try {
    const books = await prisma.book.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        rentals: {
          where: {
            returnedAt: null,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Filter by availability if requested
    type BookWithRentals = (typeof books)[number];
    let filteredBooks: BookWithRentals[] = books;
    if (available === "true") {
      filteredBooks = books.filter(
        (book: BookWithRentals) => book.rentals.length === 0
      );
    } else if (available === "false") {
      filteredBooks = books.filter(
        (book: BookWithRentals) => book.rentals.length > 0
      );
    }

    // Transform to include availability status
    const booksWithStatus = filteredBooks.map((book: BookWithRentals) => ({
      ...book,
      isAvailable: book.rentals.length === 0,
      currentRental: book.rentals[0] || null,
    }));

    return NextResponse.json(booksWithStatus);
  } catch (error) {
    console.error("Error fetching books:", error);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 }
    );
  }
}

// POST /api/books - Create a new book (authenticated)
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, author, isbn, description, coverImage } = body;

    if (!title || !author || !coverImage) {
      return NextResponse.json(
        { error: "Title, author and cover image are required" },
        { status: 400 }
      );
    }

    const book = await prisma.book.create({
      data: {
        title,
        author,
        isbn,
        description,
        coverImage,
        ownerId: session.user.id,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    console.error("Error creating book:", error);
    return NextResponse.json(
      { error: "Failed to create book" },
      { status: 500 }
    );
  }
}
