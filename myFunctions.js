$(document).ready(function () {
    $(".details-toggle").on("change", function () {
        var $detailsRow = $(this).closest("tr").next(".details-row");

        if ($(this).is(":checked")) {
            $detailsRow.stop(true, true).slideDown(200);
        } else {
            $detailsRow.stop(true, true).slideUp(200);
        }
    });


    $("#continue-button").on("click", function () {
        var selectedCars = getSelectedCars();

        if (selectedCars.length === 0) {
            $("#selection-error").text("يرجى اختيار سيارة واحدة على الأقل قبل المتابعة.").slideDown(150);
            $("#booking-section").slideUp(200);
            return;
        }

        $("#selection-error").hide();
        updateSelectedCarsSummary(selectedCars);
        $("#booking-result").hide().empty();
        $("#booking-section").stop(true, true).slideDown(250);
    });


    $("#booking-form").on("submit", function (event) {
        event.preventDefault();

        var selectedCars = getSelectedCars();
        var errors = validateBookingForm(selectedCars);

        if (errors.length > 0) {
            showErrors(errors);
            $("#booking-result").hide().empty();
            return false;
        }

        $("#form-errors").hide().empty();

        var startDate = parseISODate($("#start-date").val());
        var endDate = parseISODate($("#end-date").val());
        var rentalDays = Math.round((endDate.getTime() - startDate.getTime()) / 86400000);
        var subtotal = 0;
        var $result = $("#booking-result");
        var $list = $("<ul></ul>");

        $.each(selectedCars, function (index, car) {
            var carTotal = car.price * rentalDays;
            subtotal += carTotal;

            var line = car.model + " (" + car.code + "): " +
                formatMoney(car.price) + " × " + rentalDays + " يوم = " +
                formatMoney(carTotal) + " ل.س";
            $list.append($("<li></li>").text(line));
        });

        var discountRate = rentalDays > 7 ? 0.10 : 0;
        var discount = Math.round(subtotal * discountRate);
        var finalTotal = subtotal - discount;

        $result.empty();
        $result.append($("<h2></h2>").text("نتيجة طلب الحجز"));
        $result.append($("<p></p>").text("عدد أيام التأجير: " + rentalDays + " يوم لكل سيارة."));
        $result.append($("<h3></h3>").text("السيارات والتكلفة"));
        $result.append($list);
        $result.append($("<p></p>").text("المجموع قبل الخصم: " + formatMoney(subtotal) + " ل.س"));
        $result.append($("<p></p>").text("نسبة الخصم: " + (discountRate * 100) + "%"));
        $result.append($("<p></p>").text("قيمة الخصم: " + formatMoney(discount) + " ل.س"));
        $result.append($("<p></p>").addClass("final-total").text("المبلغ النهائي: " + formatMoney(finalTotal) + " ل.س"));
        $result.append($("<p></p>").addClass("result-note").text("تم التحقق من البيانات وحساب التكلفة. هذه نسخة تعليمية للواجهة ولا ترسل الحجز إلى خادم فعلي."));
        $result.stop(true, true).slideDown(250);

        return false;
    });



    $("#reset-button").on("click", function () {
        $("#form-errors").hide().empty();
        $("#booking-result").hide().empty();
    });
});



function getSelectedCars() {
    var selectedCars = [];

    $(".car-select:checked").each(function () {
        var $row = $(this).closest("tr");
        var code = $.trim($row.find(".car-code").text());
        var model = $.trim($row.find(".car-model").text());
        var priceText = $row.find(".car-price").text();
        var price = parseInt(priceText.replace(/[^0-9]/g, ""), 10);

        selectedCars.push({
            code: code,
            model: model,
            price: price
        });
    });

    return selectedCars;
}



function updateSelectedCarsSummary(cars) {
    var $summary = $("#selected-cars-summary");
    $summary.empty();

    $.each(cars, function (index, car) {
        var description = car.code + " - " + car.model + " - " + formatMoney(car.price) + " ل.س يومياً";
        $summary.append($("<li></li>").text(description));
    });
}



function validateBookingForm(selectedCars) {
    var errors = [];
    var fullName = $.trim($("#full-name").val());
    var nationalId = $.trim($("#national-id").val());
    var startText = $.trim($("#start-date").val());
    var endText = $.trim($("#end-date").val());
    var mobile = $.trim($("#mobile").val());
    var email = $.trim($("#email").val());

    if (selectedCars.length === 0) {
        errors.push("يجب اختيار سيارة واحدة على الأقل.");
    }


    var arabicNamePattern = /^[\u0621-\u064A\u066E-\u06D3\u06FA-\u06FC\s]+$/;
    if (fullName !== "" && !arabicNamePattern.test(fullName)) {
        errors.push("الاسم الكامل يجب أن يحتوي على أحرف عربية ومسافات فقط.");
    }

    var nationalIdPattern = /^(0[1-9]|1[0-4])[0-9]{9}$/;
    if (nationalId === "") {
        errors.push("الرقم الوطني حقل إلزامي.");
    } else if (!nationalIdPattern.test(nationalId)) {
        errors.push("الرقم الوطني يجب أن يتكون من 11 رقماً، وأن تبدأ أول خانتين من 01 إلى 14.");
    }

    var startDate = parseISODate(startText);
    var endDate = parseISODate(endText);

    if (startText === "") {
        errors.push("تاريخ بداية التأجير حقل إلزامي.");
    } else if (startDate === null) {
        errors.push("تاريخ البداية غير صحيح. استخدم الصيغة yyyy-mm-dd.");
    }

    if (endText === "") {
        errors.push("تاريخ نهاية التأجير حقل إلزامي.");
    } else if (endDate === null) {
        errors.push("تاريخ النهاية غير صحيح. استخدم الصيغة yyyy-mm-dd.");
    }

    if (startDate !== null && endDate !== null && endDate.getTime() <= startDate.getTime()) {
        errors.push("تاريخ نهاية التأجير يجب أن يكون لاحقاً لتاريخ البداية.");
    }

    var mobilePattern = /^09(0|3|8|9|4|5|6)[0-9]{7}$/;
    if (mobile !== "" && !mobilePattern.test(mobile)) {
        errors.push("رقم الموبايل يجب أن يكون 10 خانات ويبدأ ببادئة Syriatel أو MTN المعتمدة.");
    }

    /* البريد اختياري، لكن يجب أن يكون بصيغة بريد صحيحة عند إدخاله. */
    var emailPattern = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;
    if (email !== "" && !emailPattern.test(email)) {
        errors.push("يرجى إدخال بريد إلكتروني صحيح.");
    }

    return errors;
}




function parseISODate(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
        return null;
    }

    var year = parseInt(match[1], 10);
    var month = parseInt(match[2], 10);
    var day = parseInt(match[3], 10);
    var date = new Date(Date.UTC(year, month - 1, day));

    if (date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day) {
        return null;
    }

    return date;
}



function formatMoney(amount) {
    return Number(amount).toLocaleString("en-US");
}



function showErrors(errors) {
    var $errorBox = $("#form-errors");
    var $list = $("<ul></ul>");

    $.each(errors, function (index, error) {
        $list.append($("<li></li>").text(error));
    });

    $errorBox.empty();
    $errorBox.append($("<strong></strong>").text("يرجى تصحيح الأخطاء التالية:"));
    $errorBox.append($list);
    $errorBox.stop(true, true).slideDown(200);
}
