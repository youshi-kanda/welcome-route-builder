import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ja as jaLocale } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, Loader2, CheckCircle2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ja } from "@/i18n/ja";
import { reservationSchema, type ReservationFormData, getUserData } from "@/lib/validation";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const timeSlots = [
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

const Reserve = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmedData, setConfirmedData] = useState<ReservationFormData | null>(null);

  const {
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      reminder: true,
    },
  });

  const selectedDate = watch("date");
  const selectedTime = watch("time");
  const reminder = watch("reminder");

  const onSubmit = async (data: ReservationFormData) => {
    setIsSubmitting(true);

    try {
      const userData = getUserData();
      const dateTime = `${format(data.date, "yyyy/MM/dd", { locale: jaLocale })} ${data.time}`;

      // Send confirmation SMS
      await api.sendSms({
        to: userData?.phone || "+81 90 0000 0000",
        templateId: "reserve",
        variables: {
          NAME: userData?.name || "応募者様",
          URL: window.location.origin,
        },
      });

      // If reminder is enabled, send reminder SMS
      if (data.reminder) {
        await api.sendSms({
          to: userData?.phone || "+81 90 0000 0000",
          templateId: "remind",
          variables: {
            DATETIME: dateTime,
            URL: window.location.origin,
          },
        });
      }

      setConfirmedData(data);
      setIsConfirmed(true);

      toast.success(ja.reserve.successTitle, {
        description: ja.reserve.successMessage,
      });
    } catch (error) {
      console.error("Reservation error:", error);
      toast.error(ja.common.error, {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isConfirmed && confirmedData) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-8rem)] gradient-hero">
          <div className="container px-4 py-8 sm:px-6 sm:py-12">
            <div className="mx-auto max-w-md">
              <Card className="p-8 text-center shadow-lg">
                <div className="mb-6 flex justify-center">
                  <CheckCircle2 className="h-16 w-16 text-success" />
                </div>
                <h1 className="mb-4 text-2xl font-bold text-foreground">
                  {ja.reserve.successTitle}
                </h1>
                <p className="mb-6 text-muted-foreground">
                  {ja.reserve.successMessage}
                </p>

                <div className="space-y-4 rounded-lg bg-muted p-4 text-left">
                  <h2 className="font-semibold text-foreground">
                    {ja.reserve.confirmationTitle}
                  </h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-primary" />
                      <span className="font-medium">{ja.reserve.confirmationDate}:</span>
                      <span>
                        {format(confirmedData.date, "yyyy年MM月dd日", {
                          locale: jaLocale,
                        })}{" "}
                        {confirmedData.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium">{ja.reserve.confirmationReminder}:</span>
                      <span>
                        {confirmedData.reminder
                          ? ja.reserve.reminderEnabled
                          : ja.reserve.reminderDisabled}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  className="mt-6 w-full"
                  size="lg"
                  onClick={() => (window.location.href = "/")}
                >
                  トップページに戻る
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-8rem)] gradient-hero">
        <div className="container px-4 py-8 sm:px-6 sm:py-12">
          <div className="mx-auto max-w-md">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="mb-3 text-3xl font-bold text-foreground">
                {ja.reserve.title}
              </h1>
              <p className="text-base text-muted-foreground">
                {ja.reserve.subtitle}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Card className="p-6 shadow-lg sm:p-8">
                {/* Date Picker */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {ja.reserve.dateLabel}
                    <span className="ml-1 text-destructive">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="lg"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon />
                        {selectedDate ? (
                          format(selectedDate, "yyyy年MM月dd日", {
                            locale: jaLocale,
                          })
                        ) : (
                          <span>{ja.reserve.datePlaceholder}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setValue("date", date)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto"
                        locale={jaLocale}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.date && (
                    <p className="text-xs font-medium text-destructive">
                      {errors.date.message}
                    </p>
                  )}
                </div>

                {/* Time Picker */}
                <div className="mt-5 space-y-2">
                  <Label className="text-sm font-medium">
                    {ja.reserve.timeLabel}
                    <span className="ml-1 text-destructive">*</span>
                  </Label>
                  <Select
                    value={selectedTime}
                    onValueChange={(value) => setValue("time", value)}
                  >
                    <SelectTrigger
                      className={cn(
                        "w-full text-base",
                        !selectedTime && "text-muted-foreground"
                      )}
                    >
                      <SelectValue placeholder={ja.reserve.timePlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {time}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.time && (
                    <p className="text-xs font-medium text-destructive">
                      {errors.time.message}
                    </p>
                  )}
                </div>

                {/* Reminder Checkbox */}
                <div className="mt-6 flex items-start gap-3">
                  <Checkbox
                    id="reminder"
                    checked={reminder}
                    onCheckedChange={(checked) =>
                      setValue("reminder", checked === true)
                    }
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor="reminder"
                    className="cursor-pointer text-sm leading-relaxed"
                  >
                    {ja.reserve.reminderLabel}
                  </Label>
                </div>
              </Card>

              {/* Submit Button */}
              <Button
                type="submit"
                size="xl"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    {ja.common.loading}
                  </>
                ) : (
                  <>
                    <CheckCircle2 />
                    {ja.reserve.submitButton}
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reserve;
