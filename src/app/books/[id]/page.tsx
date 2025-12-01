"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookOpen,
  Trash2,
  RotateCcw,
  ImageIcon,
  Calendar,
  User,
  Hash,
  Loader2,
} from "lucide-react";
import { BookDetailSkeleton } from "@/components/loading";

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
  rentals: Rental[];
}

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const bookId = params.id as string;

  const fetchBook = useCallback(async () => {
    try {
      const response = await fetch(`/api/books/${bookId}`);
      if (response.ok) {
        const data = await response.json();
        setBook(data);
      } else if (response.status === 404) {
        toast.error("Book not found");
        router.push("/");
      }
    } catch (error) {
      console.error("Failed to fetch book:", error);
      toast.error("Failed to load book");
    } finally {
      setLoading(false);
    }
  }, [bookId, router]);

  useEffect(() => {
    fetchBook();
  }, [fetchBook]);

  const isOwner = session?.user?.id === book?.owner.id;
  const isRentedByMe = book?.currentRental?.user.id === session?.user?.id;

  async function handleRent() {
    if (!session) {
      toast.error("Please sign in to rent books");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/books/${bookId}/rent`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to rent book");
      }

      toast.success(`You rented "${book?.title}"`);
      fetchBook();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to rent book"
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReturn() {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/books/${bookId}/rent`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to return book");
      }

      toast.success(`You returned "${book?.title}"`);
      fetchBook();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to return book"
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete book");
      }

      toast.success(`"${book?.title}" deleted`);
      router.push("/");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete book"
      );
    } finally {
      setActionLoading(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("cs-CZ", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return <BookDetailSkeleton />;
  }

  if (!book) {
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Cover Image */}
          <div className="relative aspect-2/3 w-full max-w-[280px] sm:max-w-sm mx-auto lg:mx-0 rounded-lg overflow-hidden bg-muted shadow-lg">
            {book.coverImage ? (
              <Image
                src={book.coverImage}
                alt={`Cover of ${book.title}`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-20 w-20 sm:h-24 sm:w-24 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Book Info */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{book.title}</h1>
                <p className="text-lg sm:text-xl text-muted-foreground mt-1">
                  by {book.author}
                </p>
              </div>
              <Badge
                variant={book.isAvailable ? "default" : "secondary"}
                className="text-sm"
              >
                {book.isAvailable ? "Available" : "Rented"}
              </Badge>
            </div>

            {book.description && (
              <p className="text-sm sm:text-base text-muted-foreground">
                {book.description}
              </p>
            )}

            {/* Meta info */}
            <div className="flex flex-wrap gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
              {book.isbn && (
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  <span>ISBN: {book.isbn}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Added {formatDate(book.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Added by {book.owner.name || "Unknown"}</span>
              </div>
            </div>

            {/* Current rental info */}
            {!book.isAvailable && book.currentRental && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Currently Rented</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage
                        src={book.currentRental.user.image || undefined}
                      />
                      <AvatarFallback>
                        {book.currentRental.user.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {book.currentRental.user.name || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Since {formatDate(book.currentRental.rentedAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-3 flex-wrap">
              {book.isAvailable ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={actionLoading || !session}
                      size="lg"
                      className="flex-1 sm:flex-none"
                    >
                      {actionLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <BookOpen className="mr-2 h-4 w-4" />
                      )}
                      {session ? "Rent this book" : "Sign in to rent"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Rent this book?</AlertDialogTitle>
                      <AlertDialogDescription>
                        You are about to rent &quot;{book.title}&quot; by{" "}
                        {book.author}. You can return it anytime from your
                        profile.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRent}>
                        Rent
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : isRentedByMe ? (
                <Button
                  onClick={handleReturn}
                  disabled={actionLoading}
                  variant="outline"
                  size="lg"
                  className="flex-1 sm:flex-none"
                >
                  {actionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="mr-2 h-4 w-4" />
                  )}
                  Return this book
                </Button>
              ) : null}

              {isOwner && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="lg"
                      disabled={actionLoading}
                      className="flex-1 sm:flex-none"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete book?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete &quot;{book.title}&quot;
                        and all its rental history. This action cannot be
                        undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>

        {/* Rental History */}
        {book.rentals.length > 0 && (
          <Card className="mt-8 sm:mt-12">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">
                Rental History
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {/* Mobile: Card view */}
              <div className="sm:hidden space-y-3">
                {book.rentals.map((rental) => (
                  <div
                    key={rental.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={rental.user.image || undefined} />
                        <AvatarFallback className="text-xs">
                          {rental.user.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {rental.user.name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(rental.rentedAt)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={rental.returnedAt ? "outline" : "default"}
                      className="text-xs"
                    >
                      {rental.returnedAt ? "Returned" : "Active"}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Desktop: Table view */}
              <Table className="hidden sm:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Rented</TableHead>
                    <TableHead>Returned</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {book.rentals.map((rental) => (
                    <TableRow key={rental.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={rental.user.image || undefined} />
                            <AvatarFallback>
                              {rental.user.name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span>{rental.user.name || "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(rental.rentedAt)}</TableCell>
                      <TableCell>
                        {rental.returnedAt
                          ? formatDate(rental.returnedAt)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={rental.returnedAt ? "outline" : "default"}
                        >
                          {rental.returnedAt ? "Returned" : "Active"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
