import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Loader2, Send } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConsentCheckbox } from "@/components/ui/consent-checkbox";
import { toast } from "sonner";
import { ja } from "@/i18n/ja";
import { applicationSchema, type ApplicationFormData, saveUserData, getUserData } from "@/lib/validation";
import { api } from "@/lib/api";

const Home = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      phone: "",
      name: "",
      consent: false,
    },
  });

  // Load saved user data
  useEffect(() => {
    const savedData = getUserData();
    if (savedData) {
      setValue("phone", savedData.phone);
      if (savedData.name) {
        setValue("name", savedData.name);
      }
    }
  }, [setValue]);

  const consent = watch("consent");

  const onSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true);

    try {
      const chatUrl = `${window.location.origin}/chat?token=demo`;
      
      await api.sendSms({
        to: data.phone,
        templateId: "receipt",
        variables: {
          NAME: data.name || "応募者様",
          URL: chatUrl,
        },
      });

      // Save user data
      saveUserData({
        phone: data.phone,
        name: data.name,
      });

      toast.success(ja.home.successMessage, {
        description: "事前確認リンクをご確認ください",
      });

      // Navigate to chat after a short delay
      setTimeout(() => {
        navigate("/chat");
      }, 2000);
    } catch (error) {
      console.error("SMS send error:", error);
      toast.error(ja.home.errorMessage, {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="gradient-hero min-h-[calc(100vh-8rem)]">
        <div className="container px-4 py-8 sm:px-6 sm:py-12">
          <div className="mx-auto max-w-md">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl">
                {ja.home.title}
              </h1>
              <p className="text-base text-muted-foreground sm:text-lg">
                {ja.home.subtitle}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="rounded-xl bg-card p-6 shadow-lg sm:p-8">
                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    {ja.home.phoneLabel}
                    <span className="ml-1 text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={ja.home.phonePlaceholder}
                    aria-invalid={!!errors.phone}
                    aria-describedby={
                      errors.phone ? "phone-error" : "phone-hint"
                    }
                    className="text-base transition-base"
                    {...register("phone")}
                  />
                  {!errors.phone && (
                    <p id="phone-hint" className="text-xs text-muted-foreground">
                      {ja.home.phoneHint}
                    </p>
                  )}
                  {errors.phone && (
                    <p
                      id="phone-error"
                      className="text-xs font-medium text-destructive"
                      role="alert"
                      aria-live="polite"
                    >
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Name */}
                <div className="mt-5 space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    {ja.home.nameLabel}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {ja.home.nameHint}
                    </span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={ja.home.namePlaceholder}
                    className="text-base transition-base"
                    {...register("name")}
                  />
                </div>

                {/* Consent */}
                <div className="mt-6">
                  <ConsentCheckbox
                    label={ja.home.consentLabel}
                    checked={consent}
                    onCheckedChange={(checked) => setValue("consent", checked)}
                    error={errors.consent?.message}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="xl"
                disabled={isSubmitting}
                className="w-full"
                aria-label={ja.home.submitButton}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    {ja.common.loading}
                  </>
                ) : (
                  <>
                    <Send />
                    {ja.home.submitButton}
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

export default Home;
