"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { toast } from "sonner";
import { BookOpen, Trash2, RotateCcw, ImageIcon, Loader2 } from "lucide-react";

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

interface CurrentRental {
  id: string;
  rentedAt: string;
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
  currentRental: CurrentRental | null;
}

interface BookCardProps {
  book: Book;
  onUpdate: () => void;
}

export function BookCard({ book, onUpdate }: BookCardProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const isOwner = session?.user?.id === book.owner.id;
  const isRentedByMe = book.currentRental?.user.id === session?.user?.id;

  async function handleRent() {
    if (!session) {
      toast.error("Please sign in to rent books");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/books/${book.id}/rent`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to rent book");
      }

      toast.success(`You rented "${book.title}"`);
      onUpdate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to rent book"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleReturn() {
    setLoading(true);
    try {
      const response = await fetch(`/api/books/${book.id}/rent`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to return book");
      }

      toast.success(`You returned "${book.title}"`);
      onUpdate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to return book"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      const response = await fetch(`/api/books/${book.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete book");
      }

      toast.success(`"${book.title}" deleted`);
      onUpdate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete book"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex flex-col overflow-hidden py-0 h-full">
      {/* Cover Image */}
      <Link
        href={`/books/${book.id}`}
        className="relative w-full h-36 sm:h-48 bg-muted block cursor-pointer"
      >
        {book.coverImage ? (
          <Image
            src={book.coverImage}
            alt={`Cover of ${book.title}`}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/30" />
          </div>
        )}
        <Badge
          variant={book.isAvailable ? "default" : "destructive"}
          className="absolute top-2 right-2 text-xs"
        >
          {book.isAvailable ? "Available" : "Rented"}
        </Badge>
      </Link>
      <CardHeader className="pb-2 px-3 sm:px-6 py-3 sm:py-4">
        <Link href={`/books/${book.id}`} className="hover:underline">
          <CardTitle className="line-clamp-1 text-sm sm:text-base">
            {book.title}
          </CardTitle>
        </Link>
        <CardDescription className="line-clamp-1 text-xs sm:text-sm">
          by {book.author}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pt-0 px-3 sm:px-6 hidden sm:block">
        {book.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {book.description}
          </p>
        )}
        {book.isbn && (
          <p className="text-xs text-muted-foreground">ISBN: {book.isbn}</p>
        )}
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Avatar className="h-5 w-5">
            <AvatarImage src={book.owner.image || undefined} />
            <AvatarFallback className="text-xs">
              {book.owner.name?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">
            Added by {book.owner.name || "Unknown"}
          </span>
        </div>
        {!book.isAvailable && book.currentRental && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Avatar className="h-5 w-5">
              <AvatarImage src={book.currentRental.user.image || undefined} />
              <AvatarFallback className="text-xs">
                {book.currentRental.user.name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">
              Rented by {book.currentRental.user.name || "Unknown"}
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2 px-3 sm:px-6 py-3 sm:py-4">
        {book.isAvailable ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={loading || !session}
                className="flex-1 h-8 sm:h-10 text-xs sm:text-sm"
                size="sm"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <BookOpen className="mr-1.5 h-3 w-3 sm:h-4 sm:w-4" />
                    {session ? "Rent" : "Sign in"}
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>Rent this book?</AlertDialogTitle>
                <AlertDialogDescription>
                  You are about to rent &quot;{book.title}&quot; by{" "}
                  {book.author}. You can return it anytime from your profile.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRent}>Rent</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : isRentedByMe ? (
          <Button
            onClick={handleReturn}
            disabled={loading}
            variant="outline"
            className="flex-1 h-8 sm:h-10 text-xs sm:text-sm"
            size="sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <RotateCcw className="mr-1.5 h-3 w-3 sm:h-4 sm:w-4" />
                Return
              </>
            )}
          </Button>
        ) : (
          <Button
            disabled
            className="flex-1 h-8 sm:h-10 text-xs sm:text-sm"
            variant="secondary"
            size="sm"
          >
            Rented
          </Button>
        )}
        {isOwner && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                disabled={loading}
                className="h-8 w-8 sm:h-10 sm:w-10"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete book?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &quot;{book.title}&quot; and all
                  its rental history. This action cannot be undone.
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
      </CardFooter>
    </Card>
  );
}
