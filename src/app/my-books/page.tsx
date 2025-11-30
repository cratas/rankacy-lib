"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  ImageIcon,
  Trash2,
  RotateCcw,
  Library,
  BookMarked,
  Loader2,
} from "lucide-react";
import { MyBooksCardSkeleton, EmptyState } from "@/components/loading";

interface BookOwner {
  id: string;
  name: string | null;
  image: string | null;
}

interface RentalUser {
  id: string;
  name: string | null;
  image: string | null;
}

interface Rental {
  id: string;
  rentedAt: string;
  returnedAt: string | null;
  user: RentalUser;
  book?: Book;
}

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  description: string | null;
  coverImage: string | null;
  createdAt: string;
  owner: BookOwner;
  isAvailable: boolean;
  currentRental: Rental | null;
  rentals?: Rental[];
}

export default function MyBooksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [myRentals, setMyRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      // Fetch all books and filter client-side
      const booksResponse = await fetch("/api/books");
      if (booksResponse.ok) {
        const allBooks = await booksResponse.json();

        // My owned books
        const owned = allBooks.filter(
          (book: Book) => book.owner.id === session.user?.id
        );
        setMyBooks(owned);

        // My rentals (current and past)
        const rentals: Rental[] = [];
        for (const book of allBooks) {
          if (book.rentals) {
            for (const rental of book.rentals) {
              if (rental.user.id === session.user?.id) {
                rentals.push({ ...rental, book });
              }
            }
          }
          // Also check currentRental for books without full rental history
          if (
            book.currentRental &&
            book.currentRental.user.id === session.user?.id
          ) {
            const exists = rentals.some((r) => r.id === book.currentRental.id);
            if (!exists) {
              rentals.push({ ...book.currentRental, book });
            }
          }
        }
        // Sort by rentedAt descending
        rentals.sort(
          (a, b) =>
            new Date(b.rentedAt).getTime() - new Date(a.rentedAt).getTime()
        );
        setMyRentals(rentals);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchData();
    }
  }, [status, router, fetchData]);

  async function handleReturn(bookId: string, bookTitle: string) {
    setActionLoading(bookId);
    try {
      const response = await fetch(`/api/books/${bookId}/rent`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to return book");
      }

      toast.success(`You returned "${bookTitle}"`);
      fetchData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to return book"
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(bookId: string, bookTitle: string) {
    setActionLoading(bookId);
    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete book");
      }

      toast.success(`"${bookTitle}" deleted`);
      fetchData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete book"
      );
    } finally {
      setActionLoading(null);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("cs-CZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-4 sm:py-8">
          <div className="h-8 w-32 bg-muted rounded animate-pulse mb-6 sm:mb-8" />
          <div className="h-8 sm:h-10 w-48 sm:w-64 bg-muted rounded animate-pulse mb-6" />
          <div className="h-10 w-full max-w-md bg-muted rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <MyBooksCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-4 sm:mb-8 -ml-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Library
        </Button>

        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
          My Books
        </h1>

        <Tabs defaultValue="owned" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 h-auto">
            <TabsTrigger
              value="owned"
              className="flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm"
            >
              <Library className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>My Books</span>
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {myBooks.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="rentals"
              className="flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm"
            >
              <BookMarked className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Rentals</span>
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {myRentals.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* My Owned Books */}
          <TabsContent value="owned" className="mt-4 sm:mt-6">
            {myBooks.length === 0 ? (
              <EmptyState
                icon={<Library className="h-12 w-12 text-muted-foreground" />}
                title="You haven't added any books yet"
                description="Add a book to the library to see it here."
                action={
                  <Button onClick={() => router.push("/")}>
                    Go to Library
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {myBooks.map((book) => (
                  <Card key={book.id} className="overflow-hidden h-full py-0">
                    <Link
                      href={`/books/${book.id}`}
                      className="block relative h-28 sm:h-32 bg-muted"
                    >
                      {book.coverImage ? (
                        <Image
                          src={book.coverImage}
                          alt={book.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/30" />
                        </div>
                      )}
                      <Badge
                        variant={book.isAvailable ? "default" : "secondary"}
                        className="absolute top-2 right-2 text-xs"
                      >
                        {book.isAvailable ? "Available" : "Rented"}
                      </Badge>
                    </Link>
                    <CardHeader className="pb-2 px-3 sm:px-4">
                      <Link
                        href={`/books/${book.id}`}
                        className="hover:underline"
                      >
                        <CardTitle className="text-sm sm:text-base line-clamp-1">
                          {book.title}
                        </CardTitle>
                      </Link>
                      <CardDescription className="line-clamp-1 text-xs sm:text-sm">
                        {book.author}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {formatDate(book.createdAt)}
                        </span>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={actionLoading === book.id}
                              className="h-8 w-8 p-0"
                            >
                              {actionLoading === book.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-destructive" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete book?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete &quot;
                                {book.title}
                                &quot; and all its rental history.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDelete(book.id, book.title)
                                }
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      {!book.isAvailable && book.currentRental && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <Avatar className="h-4 w-4 sm:h-5 sm:w-5">
                            <AvatarImage
                              src={book.currentRental.user.image || undefined}
                            />
                            <AvatarFallback className="text-xs">
                              {book.currentRental.user.name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">
                            Rented by {book.currentRental.user.name}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Rentals */}
          <TabsContent value="rentals" className="mt-4 sm:mt-6">
            {myRentals.length === 0 ? (
              <EmptyState
                icon={
                  <BookMarked className="h-12 w-12 text-muted-foreground" />
                }
                title="You haven't rented any books yet"
                description="Browse the library and rent a book."
                action={
                  <Button onClick={() => router.push("/")}>
                    Go to Library
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {myRentals.map((rental) => (
                  <Card key={rental.id} className="py-0">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex gap-3 sm:gap-4">
                        <Link
                          href={`/books/${rental.book?.id}`}
                          className="relative w-12 h-18 sm:w-16 sm:h-24 bg-muted rounded overflow-hidden shrink-0"
                        >
                          {rental.book?.coverImage ? (
                            <Image
                              src={rental.book.coverImage}
                              alt={rental.book?.title || "Book"}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground/30" />
                            </div>
                          )}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <Link
                                href={`/books/${rental.book?.id}`}
                                className="hover:underline"
                              >
                                <h3 className="font-semibold line-clamp-1 text-sm sm:text-base">
                                  {rental.book?.title}
                                </h3>
                              </Link>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                {rental.book?.author}
                              </p>
                            </div>
                            <Badge
                              variant={
                                rental.returnedAt ? "outline" : "default"
                              }
                              className="text-xs shrink-0"
                            >
                              {rental.returnedAt ? "Returned" : "Active"}
                            </Badge>
                          </div>
                          <div className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
                            <span>{formatDate(rental.rentedAt)}</span>
                            {rental.returnedAt && (
                              <span className="hidden sm:inline ml-3">
                                → {formatDate(rental.returnedAt)}
                              </span>
                            )}
                          </div>
                          {!rental.returnedAt && rental.book && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 sm:mt-3 h-8 text-xs sm:text-sm"
                              onClick={() =>
                                handleReturn(
                                  rental.book!.id,
                                  rental.book!.title
                                )
                              }
                              disabled={actionLoading === rental.book.id}
                            >
                              {actionLoading === rental.book.id ? (
                                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                              ) : (
                                <RotateCcw className="mr-1.5 h-3 w-3" />
                              )}
                              Return
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
